const crypto = require("crypto");
const sendEmail = require("../config/email");

const sendVerificationEmail = async (user, req) => {
  // Generate a random token
  const token = crypto.randomBytes(32).toString("hex");
  user.verificationToken = token;
  user.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  await user.save();

  // Build verification link (frontend route)
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email/${token}`;

  // HTML email content
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Marketplace!</h2>
      <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
      <a href="${verificationUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 16px 0;">Verify Email</a>
      <p>Or copy this link into your browser:</p>
      <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      <p>This link expires in 24 hours.</p>
      <hr />
      <p style="color: #6b7280; font-size: 12px;">If you did not create an account, please ignore this email.</p>
    </div>
  `;

  await sendEmail(user.email, "Verify Your Email", html);
};

module.exports = sendVerificationEmail;
