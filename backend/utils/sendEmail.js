const nodemailer = require("nodemailer");

let transporter;

// Create test account automatically
nodemailer.createTestAccount().then(testAccount => {
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  console.log("📧 Ethereal Email Ready");
  console.log("User:", testAccount.user);
  console.log("Pass:", testAccount.pass);
});

const sendEmail = async (to, subject, text) => {
  const info = await transporter.sendMail({
    from: '"Travel Booking App" <no-reply@test.com>',
    to,
    subject,
    text,
  });

  console.log("📨 OTP Email Preview URL:");
  console.log(nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
