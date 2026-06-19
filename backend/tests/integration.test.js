import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import crypto from "crypto";

// Mock sendEmail utility so we don't try to send real emails during testing
vi.mock("../utils/sendEmail.js", () => ({
  default: vi.fn().mockResolvedValue(true),
  buildResetEmail: vi.fn().mockImplementation((name, url) => `<div>Reset: ${url}</div>`),
  buildVerificationEmail: vi.fn().mockImplementation((name, url) => `<div>Verify: ${url}</div>`),
}));

// Set Node env to test before importing app
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "mock_jwt_secret_value_for_testing_123456789";

// Import app and models after env sets
import { app } from "../index.js";
import User from "../models/User.model.js";
import Post from "../models/Post.model.js";
import Connection from "../models/Connection.model.js";
import Report from "../models/Report.model.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Helper to register, verify, and return user with token
async function createAndVerifyUser(userData) {
  const regRes = await request(app)
    .post("/api/auth/register")
    .send(userData);
  
  const user = regRes.body.user;
  const token = regRes.body.token;

  // Retrieve raw token from mock call
  const sendEmailMock = (await import("../utils/sendEmail.js")).default;
  const calls = sendEmailMock.mock.calls;
  const lastCall = calls[calls.length - 1];
  const emailHtml = lastCall[0].html;
  
  // Extract token: matches /verify-email/(token)
  const tokenMatch = emailHtml.match(/\/verify-email\/([a-f0-9]+)/);
  if (tokenMatch && tokenMatch[1]) {
    const rawToken = tokenMatch[1];
    await request(app).get(`/api/auth/verify-email/${rawToken}`);
  }

  return { user: await User.findById(user._id), token };
}

describe("Integration Tests", () => {
  
  // ─── 1. Auth Suite ─────────────────────────────────────────────────────────
  describe("Auth flows", () => {
    it("should successfully register, email verify, login, and handle password resets", async () => {
      // Register
      const registerData = {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
        username: "testuser",
      };

      const regRes = await request(app)
        .post("/api/auth/register")
        .send(registerData);

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.token).toBeDefined();
      expect(regRes.body.user.isVerified).toBe(false);

      // Verify DB hashed verification token
      const dbUser = await User.findOne({ email: "test@example.com" });
      expect(dbUser).toBeDefined();
      expect(dbUser.verificationToken).toBeDefined();
      expect(dbUser.isVerified).toBe(false);

      // Verify email callback links
      const sendEmailMock = (await import("../utils/sendEmail.js")).default;
      expect(sendEmailMock).toHaveBeenCalled();
      const lastCall = sendEmailMock.mock.calls[sendEmailMock.mock.calls.length - 1];
      const emailHtml = lastCall[0].html;
      const tokenMatch = emailHtml.match(/\/verify-email\/([a-f0-9]+)/);
      const rawToken = tokenMatch[1];

      // Verification token hashing logic: sha256
      const hashedExpected = crypto.createHash("sha256").update(rawToken).digest("hex");
      expect(dbUser.verificationToken).toBe(hashedExpected);

      // Verify email route
      const verifyRes = await request(app).get(`/api/auth/verify-email/${rawToken}`);
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.success).toBe(true);

      const verifiedUser = await User.findOne({ email: "test@example.com" });
      expect(verifiedUser.isVerified).toBe(true);
      expect(verifiedUser.verificationToken).toBeUndefined();

      // Login
      const loginRes = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.token).toBeDefined();
      expect(loginRes.body.user.isVerified).toBe(true);

      // Forgot Password Request
      const forgotRes = await request(app)
        .post("/api/auth/forgot-password")
        .send({ email: "test@example.com" });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);

      // Extract raw reset token
      const lastEmailCall = sendEmailMock.mock.calls[sendEmailMock.mock.calls.length - 1];
      const resetHtml = lastEmailCall[0].html;
      const resetTokenMatch = resetHtml.match(/\/reset-password\/([a-f0-9]+)/);
      const rawResetToken = resetTokenMatch[1];

      // Reset password route
      const resetRes = await request(app)
        .post(`/api/auth/reset-password/${rawResetToken}`)
        .send({ password: "newpassword123" });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Validate login fails with old password, succeeds with new
      const failLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "password123" });
      expect(failLogin.status).toBe(401);

      const successLogin = await request(app)
        .post("/api/auth/login")
        .send({ email: "test@example.com", password: "newpassword123" });
      expect(successLogin.status).toBe(200);
      expect(successLogin.body.token).toBeDefined();
    });
  });

  // ─── 2. Connection Request Lifecycle ───────────────────────────────────────
  describe("Connection request lifecycle", () => {
    it("should handle request lifecycles (send, accept, reject, withdraw, and duplicate block)", async () => {
      const userAData = await createAndVerifyUser({
        name: "User A",
        email: "usera@example.com",
        password: "password123",
        username: "usera",
      });

      const userBData = await createAndVerifyUser({
        name: "User B",
        email: "userb@example.com",
        password: "password123",
        username: "userb",
      });

      const tokenA = userAData.token;
      const tokenB = userBData.token;
      const idB = userBData.user._id.toString();

      // Send Connection Request (A -> B)
      const sendRes = await request(app)
        .post(`/api/connections/request/${idB}`)
        .set("Authorization", `Bearer ${tokenA}`);

      expect(sendRes.status).toBe(201);
      expect(sendRes.body.success).toBe(true);
      expect(sendRes.body.connection.status).toBe("pending");
      
      const connId = sendRes.body.connection._id;

      // Duplicate prevention check
      const dupRes = await request(app)
        .post(`/api/connections/request/${idB}`)
        .set("Authorization", `Bearer ${tokenA}`);
      
      expect(dupRes.status).toBe(400);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.message).toContain("Request already exists");

      // Withdraw Request
      const withdrawRes = await request(app)
        .delete(`/api/connections/withdraw/${idB}`)
        .set("Authorization", `Bearer ${tokenA}`);
      expect(withdrawRes.status).toBe(200);

      // Re-send to test accept/reject lifecycle
      const reSendRes = await request(app)
        .post(`/api/connections/request/${idB}`)
        .set("Authorization", `Bearer ${tokenA}`);
      const newConnId = reSendRes.body.connection._id;

      // Accept request (B accepts A's request)
      const acceptRes = await request(app)
        .put(`/api/connections/respond/${newConnId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ action: "accept" });

      expect(acceptRes.status).toBe(200);
      expect(acceptRes.body.connection.status).toBe("accepted");

      // Verify connection lists updated in DB
      const updatedA = await User.findById(userAData.user._id);
      const updatedB = await User.findById(userBData.user._id);

      expect(updatedA.connections.map(c => c.toString())).toContain(idB);
      expect(updatedB.connections.map(c => c.toString())).toContain(userAData.user._id.toString());
    });
  });

  // ─── 3. Privacy Gating Gaps ────────────────────────────────────────────────
  describe("Privacy gating gaps", () => {
    it("should prevent non-connections from viewing stats/posts of private user", async () => {
      // Create private user A
      const userAData = await createAndVerifyUser({
        name: "Private User",
        email: "privateuser@example.com",
        password: "password123",
        username: "privateuser",
      });

      // Update A to be private
      const userA = userAData.user;
      userA.isPublic = false;
      await userA.save();

      // Create user B (unconnected non-friend)
      const userBData = await createAndVerifyUser({
        name: "Public Nonfriend",
        email: "nonfriend@example.com",
        password: "password123",
        username: "nonfriend",
      });

      // Create user C (connected friend of A)
      const userCData = await createAndVerifyUser({
        name: "Friend User",
        email: "friend@example.com",
        password: "password123",
        username: "friend",
      });

      // Establish connection between A and C
      const userC = userCData.user;
      userA.connections.push(userC._id);
      userC.connections.push(userA._id);
      await Promise.all([userA.save(), userC.save()]);

      // Create a post by private user A
      await Post.create({
        author: userA._id,
        content: "Secret details only for friends",
      });

      // Non-connection (B) tries to fetch A's posts -> should fail (403)
      const bPostsRes = await request(app)
        .get(`/api/users/${userA._id}/posts`)
        .set("Authorization", `Bearer ${userBData.token}`);
      expect(bPostsRes.status).toBe(403);
      expect(bPostsRes.body.success).toBe(false);

      // Non-connection (B) tries to fetch A's stats -> should fail (403)
      const bStatsRes = await request(app)
        .get(`/api/users/${userA._id}/stats`)
        .set("Authorization", `Bearer ${userBData.token}`);
      expect(bStatsRes.status).toBe(403);
      expect(bStatsRes.body.success).toBe(false);

      // Connection (C) tries to fetch A's posts -> should succeed (200)
      const cPostsRes = await request(app)
        .get(`/api/users/${userA._id}/posts`)
        .set("Authorization", `Bearer ${userCData.token}`);
      expect(cPostsRes.status).toBe(200);
      expect(cPostsRes.body.posts.length).toBe(1);

      // Connection (C) tries to fetch A's stats -> should succeed (200)
      const cStatsRes = await request(app)
        .get(`/api/users/${userA._id}/stats`)
        .set("Authorization", `Bearer ${userCData.token}`);
      expect(cStatsRes.status).toBe(200);
      expect(cStatsRes.body.stats.postCount).toBe(1);
    });
  });

  // ─── 4. Block-list Enforcement ─────────────────────────────────────────────
  describe("Block-list enforcement", () => {
    it("should prevent blocked interactions (connection requests / messages)", async () => {
      const userAData = await createAndVerifyUser({
        name: "User Block A",
        email: "blocka@example.com",
        password: "password123",
        username: "blocka",
      });

      const userBData = await createAndVerifyUser({
        name: "User Block B",
        email: "blockb@example.com",
        password: "password123",
        username: "blockb",
      });

      // User A blocks User B
      userAData.user.blockedUsers.push(userBData.user._id);
      await userAData.user.save();

      // Blocked user B tries to send connection request to A -> should fail (403)
      const connectRes = await request(app)
        .post(`/api/connections/request/${userAData.user._id}`)
        .set("Authorization", `Bearer ${userBData.token}`);
      expect(connectRes.status).toBe(403);
      expect(connectRes.body.success).toBe(false);

      // Blocked user B tries to send message to A -> should fail (403)
      const messageRes = await request(app)
        .post(`/api/messages/${userAData.user._id.toString()}`)
        .set("Authorization", `Bearer ${userBData.token}`)
        .send({ content: "Hello" });
      expect(messageRes.status).toBe(403);
      expect(messageRes.body.success).toBe(false);
    });
  });

  // ─── 5. Moderation/Admin Gating & Suspension ──────────────────────────────
  describe("Moderation gating and suspension checks", () => {
    it("should allow admins to list reports, resolve them, suspend users, and deny suspended tokens", async () => {
      const adminData = await createAndVerifyUser({
        name: "System Admin",
        email: "admin@example.com",
        password: "password123",
        username: "adminuser",
      });

      // Update role to admin in DB
      adminData.user.role = "admin";
      await adminData.user.save();

      const offenderData = await createAndVerifyUser({
        name: "Bad User",
        email: "offender@example.com",
        password: "password123",
        username: "baduser",
      });

      // Post report
      const report = await Report.create({
        reporter: adminData.user._id,
        reportedUser: offenderData.user._id,
        reason: "spam",
        status: "pending",
      });

      // Admin lists reports
      const reportsRes = await request(app)
        .get("/api/admin/reports")
        .set("Authorization", `Bearer ${adminData.token}`);
      expect(reportsRes.status).toBe(200);
      expect(reportsRes.body.reports.length).toBe(1);
      expect(reportsRes.body.reports[0].reason).toBe("spam");

      // Admin resolves report
      const resolveRes = await request(app)
        .patch(`/api/admin/reports/${report._id}`)
        .set("Authorization", `Bearer ${adminData.token}`)
        .send({ status: "resolved" });
      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.report.status).toBe("resolved");

      // Admin suspends user
      const suspendRes = await request(app)
        .put(`/api/admin/users/${offenderData.user._id}/suspend`)
        .set("Authorization", `Bearer ${adminData.token}`)
        .send({ isSuspended: true });
      expect(suspendRes.status).toBe(200);
      expect(suspendRes.body.success).toBe(true);

      // Verify offender cannot access verify-email or me endpoint with old JWT token
      const meRes = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${offenderData.token}`);
      expect(meRes.status).toBe(403);
      expect(meRes.body.success).toBe(false);
      expect(meRes.body.message).toContain("suspended");
    });
  });
});
