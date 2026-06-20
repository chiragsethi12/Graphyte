import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto";
import User from "../models/User.model.js";
import generateToken from "../utils/generateToken.js";
import sendEmail, { buildResetEmail, buildVerificationEmail } from "../utils/sendEmail.js";

/**
 * Generate a URL-safe username from a display name.
 * e.g. "John Doe" → "john-doe-a3f2"
 * The random suffix prevents collisions.
 */
const generateUsername = async (name) => {
    const base = name
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .slice(0, 28);

    let username;
    let exists = true;

    while (exists) {
        const suffix = Math.random().toString(36).slice(2, 6); // 4 random chars
        username = `${base}-${suffix}`;
        exists = await User.exists({ username });
    }

    return username;
};

// GET /api/auth/check-username?username=QUERY  (PUBLIC)
export const checkUsernameAvailability = asyncHandler(async (req, res) => {
    const { username } = req.query;

    if (!username || username.length < 3)
        return res.status(400).json({ available: false, message: "Username must be at least 3 characters" });

    const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");

    if (!clean)
        return res.status(400).json({ available: false, message: "Invalid username format" });

    const exists = await User.exists({ username: clean });

    res.json({
        available: !exists,
        username: clean,
        message: exists ? "Username is taken" : "Username is available",
    });
});

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
    const { name, email, password, username } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ success: false, message: "All fields are required" });

    if (name.trim().length < 2)
        return res.status(400).json({ success: false, message: "Name must be at least 2 characters" });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ success: false, message: "Please enter a valid email address" });

    if (password.length < 6)
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    if (password.length > 128)
        return res.status(400).json({ success: false, message: "Password is too long" });

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: cleanEmail });
    if (exists)
        return res.status(400).json({ success: false, message: "Email already registered" });

    let finalUsername;

    if (username) {
        const clean = username.toLowerCase().replace(/[^a-z0-9_-]/g, "");
        if (clean.length < 3)
            return res.status(400).json({ success: false, message: "Username must be at least 3 characters" });
        if (clean.length > 30)
            return res.status(400).json({ success: false, message: "Username must be under 30 characters" });
        
        const taken = await User.exists({ username: clean });
        if (taken)
            return res.status(400).json({ success: false, message: "Username already taken" });
        finalUsername = clean;
    } else {
        finalUsername = await generateUsername(cleanName);
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const user = await User.create({
        name: cleanName,
        email: cleanEmail,
        password,
        username: finalUsername,
        verificationToken: hashedToken,
        verificationExpires,
        isVerified: false
    });

    const token = generateToken(user._id, user.tokenVersion);

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: "Verify your Graphyte account",
            html: buildVerificationEmail(user.name, verifyUrl),
        });
    } catch (err) {
        req.log.error({ err }, "Email send error during registration");
    }

    res.status(201).json({
        success: true,
        token,
        user: {
            _id:        user._id,
            name:       user.name,
            username:   user.username,
            email:      user.email,
            profilePic: user.profilePic,
            headline:   user.headline,
            isNewUser:  user.isNewUser,
            blockedUsers: user.blockedUsers || [],
            isVerified: false,
        },
    });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ success: false, message: "All fields are required" });

    if (password.length > 128)
        return res.status(400).json({ success: false, message: "Invalid credentials" });

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: cleanEmail });

    if (user && user.lockUntil && user.lockUntil > Date.now()) {
        return res.status(429).json({ success: false, message: "Too many login attempts. Please try again later." });
    }

    const isMatch = user ? await user.matchPassword(password) : false;
    if (!user || !isMatch) {
        if (user) {
            user.failedLoginAttempts += 1;
            if (user.failedLoginAttempts >= 5) {
                user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins lock
            }
            await user.save();
        }
        return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Reset attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
        success: true,
        token,
        user: {
            _id:        user._id,
            name:       user.name,
            username:   user.username,
            email:      user.email,
            profilePic: user.profilePic,
            headline:   user.headline,
            isNewUser:  user.isNewUser,
            blockedUsers: user.blockedUsers || [],
            isVerified: user.isVerified || false,
        },
    });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req, res) => {
    // req.user is populated by protect middleware (no password)
    res.json({ success: true, user: req.user });
});

// POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email)
        return res.status(400).json({ success: false, message: "Email is required" });

    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: cleanEmail });

    // Always return success to avoid leaking whether an email is registered
    if (!user) {
        return res.json({
            success: true,
            message: "If an account with that email exists, a reset link has been sent.",
        });
    }

    // Generate a raw token and hash it for storage
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateModifiedOnly: true });

    // Build the reset URL (raw token goes in the email, hashed version in DB)
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
        await sendEmail({
            to: user.email,
            subject: "Reset your Graphyte password",
            html: buildResetEmail(user.name, resetUrl),
        });
    } catch (err) {
        // If email fails, clear the token so the user can retry
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save({ validateModifiedOnly: true });
        req.log.error({ err }, "Email send error");
        return res.status(500).json({ success: false, message: "Failed to send reset email. Please try again." });
    }

    res.json({
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
    });
});

// POST /api/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6)
        return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });

    if (password.length > 128)
        return res.status(400).json({ success: false, message: "Password is too long" });

    // Hash the incoming raw token to compare with the stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user)
        return res.status(400).json({ success: false, message: "Invalid or expired reset token" });

    // Update password (pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.json({ success: true, message: "Password reset successful. You can now sign in." });
});

// GET /api/auth/verify-email/:token
export const verifyEmail = asyncHandler(async (req, res) => {
    const { token } = req.params;
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
        verificationToken: hashedToken,
        verificationExpires: { $gt: Date.now() },
    });

    if (!user) {
        return res.status(400).json({ success: false, message: "Invalid or expired verification link" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Email verified successfully" });
});

// POST /api/auth/resend-verification
export const resendVerification = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isVerified) {
        return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.verificationToken = hashedToken;
    user.verificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const verifyUrl = `${clientUrl}/verify-email/${rawToken}`;

    await sendEmail({
        to: user.email,
        subject: "Verify your Graphyte account",
        html: buildVerificationEmail(user.name, verifyUrl),
    });

    res.json({ success: true, message: "Verification link sent successfully" });
});

// POST /api/auth/google/callback
export const googleCallback = asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code is required" });

    // Exchange code for Google access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: process.env.GOOGLE_REDIRECT_URI,
            grant_type: "authorization_code",
        }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
        return res.status(400).json({ success: false, message: tokenData.error_description || "Google token exchange failed" });
    }

    const { access_token } = tokenData;

    // Fetch Google profile details
    const userResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${access_token}` },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
        return res.status(400).json({ success: false, message: "Failed to fetch Google user info" });
    }

    const { sub: googleId, email, name, picture } = userData;
    if (!email) {
        return res.status(400).json({ success: false, message: "No email address returned from Google" });
    }

    const cleanEmail = email.toLowerCase();

    // Check if user already exists with googleId
    let user = await User.findOne({ googleId });

    if (!user) {
        // If not, see if email matches an existing user
        user = await User.findOne({ email: cleanEmail });
        if (user) {
            // Link account
            user.googleId = googleId;
            user.isVerified = true;
            await user.save();
        } else {
            // Register new passwordless user
            const username = await generateUsername(name);
            const randomPassword = crypto.randomBytes(16).toString("hex");
            user = await User.create({
                name,
                email: cleanEmail,
                password: randomPassword,
                username,
                googleId,
                profilePic: picture || "",
                isVerified: true,
            });
        }
    }

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
        success: true,
        token,
        user: {
            _id:        user._id,
            name:       user.name,
            username:   user.username,
            email:      user.email,
            profilePic: user.profilePic,
            headline:   user.headline,
            isNewUser:  user.isNewUser,
            blockedUsers: user.blockedUsers || [],
            isVerified: user.isVerified || false,
        },
    });
});

// POST /api/auth/github/callback
export const githubCallback = asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code is required" });

    // Exchange code for GitHub access token
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Accept: "application/json",
        },
        body: new URLSearchParams({
            code,
            client_id: process.env.GITHUB_CLIENT_ID,
            client_secret: process.env.GITHUB_CLIENT_SECRET,
            redirect_uri: process.env.GITHUB_REDIRECT_URI,
        }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || tokenData.error) {
        return res.status(400).json({ success: false, message: tokenData.error_description || "GitHub token exchange failed" });
    }

    const { access_token } = tokenData;

    // Fetch GitHub user profile
    const userResponse = await fetch("https://api.github.com/user", {
        headers: {
            Authorization: `Bearer ${access_token}`,
            "User-Agent": "Graphyte-OAuth",
        },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
        return res.status(400).json({ success: false, message: "Failed to fetch GitHub user info" });
    }

    const githubId = userData.id.toString();
    const name = userData.name || userData.login;
    const picture = userData.avatar_url;
    let email = userData.email;

    // Fetch private email addresses if public email is not shared
    if (!email) {
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
            headers: {
                Authorization: `Bearer ${access_token}`,
                "User-Agent": "Graphyte-OAuth",
            },
        });
        const emailsData = await emailsResponse.json();
        if (emailsResponse.ok && Array.isArray(emailsData)) {
            const primaryEmailObj = emailsData.find(e => e.primary && e.verified) ||
                                    emailsData.find(e => e.verified) ||
                                    emailsData[0];
            email = primaryEmailObj?.email;
        }
    }

    if (!email) {
        return res.status(400).json({ success: false, message: "Could not retrieve email from GitHub account" });
    }

    const cleanEmail = email.toLowerCase();

    // Check if user already exists with githubId
    let user = await User.findOne({ githubId });

    if (!user) {
        // If not, see if email matches an existing user
        user = await User.findOne({ email: cleanEmail });
        if (user) {
            // Link account
            user.githubId = githubId;
            user.isVerified = true;
            await user.save();
        } else {
            // Register new passwordless user
            const username = await generateUsername(name);
            const randomPassword = crypto.randomBytes(16).toString("hex");
            user = await User.create({
                name,
                email: cleanEmail,
                password: randomPassword,
                username,
                githubId,
                profilePic: picture || "",
                isVerified: true,
            });
        }
    }

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
        success: true,
        token,
        user: {
            _id:        user._id,
            name:       user.name,
            username:   user.username,
            email:      user.email,
            profilePic: user.profilePic,
            headline:   user.headline,
            isNewUser:  user.isNewUser,
            blockedUsers: user.blockedUsers || [],
            isVerified: user.isVerified || false,
        },
    });
});