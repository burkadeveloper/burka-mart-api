const nodemailer = require("nodemailer");

let transporter = null;
let testAccount = null;

const createTransporter = async () => {
  // Create a test account on Ethereal (fake SMTP)
  testAccount = await nodemailer.createTestAccount();
  console.log("📧 Ethereal test account created");

  return nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

const getTransporter = async () => {
  if (!transporter) {
    transporter = await createTransporter();
  }
  return transporter;
};

const sendEmail = async (to, subject, html, text = "") => {
  try {
    const mailTransporter = await getTransporter();
    const info = await mailTransporter.sendMail({
      from: '"Marketplace" <noreply@marketplace.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""),
      html,
    });
    console.log(`✅ Email sent to ${to}`);
    console.log(`🔗 Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    return info;
  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return null;
  }
};

module.exports = sendEmail;
