const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  let transporter;

  if (process.env.NODE_ENV === 'development') {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log('📧 Ethereal test account:', testAccount.user);
  } else {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const info = await transporter.sendMail({
    from: `"${process.env.FROM_NAME || 'FAQ Portal'}" <${process.env.FROM_EMAIL || process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });

  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
  }
};

module.exports = { sendEmail };