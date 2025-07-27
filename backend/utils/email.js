import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    await transporter.sendMail({
      from: `"JobPortalteam"<${process.env.EMAIL_USER}>`,
      to,
      subject,
      html, 
    });
    console.log(`✅ Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Email sending error:", error);
  }
};

export default sendEmail;
