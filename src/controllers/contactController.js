const sendEmail = require("../config/email");

const submitContact = async (req, res) => {
  const { name, email, message } = req.body;
  try {
    await sendEmail(
      "burkaa16@gmail.com", // your email address
      `New Contact Message from ${name}`,
      `<h2>New Contact Message</h2>
       <p><strong>Name:</strong> ${name}</p>
       <p><strong>Email:</strong> ${email}</p>
       <p><strong>Message:</strong><br/>${message}</p>`,
    );
    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("Contact email error:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
};

module.exports = { submitContact };
