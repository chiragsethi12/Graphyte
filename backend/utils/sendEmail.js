import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 5000, // 5 seconds
    greetingTimeout: 5000,
    socketTimeout: 5000,
});

/**
 * Send a branded HTML email.
 * @param {{ to: string, subject: string, html: string }} options
 */
export default async function sendEmail({ to, subject, html }) {
    await transporter.sendMail({
        from: `"Graphyte" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
    });
}

/**
 * Build branded password-reset email HTML.
 */
export function buildResetEmail(name, resetUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#660033 0%,#4d0026 100%);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Graphyte</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Professional Networking Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;font-weight:700;">Reset your password</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
              Hi <strong>${name}</strong>, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong>1 hour</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr><td align="center" style="background:#660033;border-radius:8px;">
                <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                  Reset Password
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 12px;color:#9ca3af;font-size:12px;line-height:1.5;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;color:#660033;font-size:12px;">${resetUrl}</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
              If you didn't request this, you can safely ignore this email — your password will remain unchanged.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">© ${new Date().getFullYear()} Graphyte Professional. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Build branded verification email HTML.
 */
export function buildVerificationEmail(name, verifyUrl) {
    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#660033 0%,#4d0026 100%);padding:32px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.5px;">Graphyte</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:13px;">Professional Networking Platform</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;">
            <h2 style="margin:0 0 8px;color:#1a1a1a;font-size:20px;font-weight:700;">Verify your email address</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:14px;line-height:1.6;">
              Hi <strong>${name}</strong>, thank you for joining Graphyte. Click the button below to verify your email address. This link is valid for <strong>24 hours</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
              <tr><td align="center" style="background:#660033;border-radius:8px;">
                <a href="${verifyUrl}" target="_blank" style="display:inline-block;padding:14px 36px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.3px;">
                  Verify Email
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 12px;color:#9ca3af;font-size:12px;line-height:1.5;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="margin:0 0 24px;word-break:break-all;color:#660033;font-size:12px;">${verifyUrl}</p>
            <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 20px;" />
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
              If you did not sign up for a Graphyte account, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;text-align:center;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">© ${new Date().getFullYear()} Graphyte Professional. All rights reserved.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

/**
 * Build branded job-alert digest email HTML.
 * @param {string} name     User's display name
 * @param {Array}  jobs     Array of { title, company, _id }
 * @param {string} alertName  Name of the saved search
 */
export function buildJobAlertEmail(name, jobs, alertName) {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const jobRows = jobs.slice(0, 10).map((j) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #f3f4f6;">
            <a href="${clientUrl}/jobs?q=${encodeURIComponent(j.title)}" target="_blank"
               style="color:#660033;font-size:14px;font-weight:600;text-decoration:none;">${j.title}</a>
            <p style="margin:2px 0 0;color:#6b7280;font-size:12px;">${j.company}${j.location ? ` · ${j.location}` : ""}</p>
          </td>
        </tr>`).join("");

    return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#660033 0%,#4d0026 100%);padding:28px 40px;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">Graphyte</h1>
            <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:12px;">Job Alert Digest</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 40px 20px;">
            <h2 style="margin:0 0 6px;color:#1a1a1a;font-size:18px;font-weight:700;">${alertName}</h2>
            <p style="margin:0 0 20px;color:#6b7280;font-size:13px;line-height:1.5;">
              Hi <strong>${name}</strong>, we found <strong>${jobs.length}</strong> new job${jobs.length !== 1 ? "s" : ""} matching your alert.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${jobRows}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 40px 28px;">
            <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
              <tr><td align="center" style="background:#660033;border-radius:8px;">
                <a href="${clientUrl}/jobs" target="_blank" style="display:inline-block;padding:12px 32px;color:#ffffff;font-size:13px;font-weight:700;text-decoration:none;">
                  View All Jobs
                </a>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:18px 40px 24px;text-align:center;border-top:1px solid #f3f4f6;">
            <p style="margin:0;color:#d1d5db;font-size:11px;">© ${new Date().getFullYear()} Graphyte. You received this because you have a saved job alert.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
