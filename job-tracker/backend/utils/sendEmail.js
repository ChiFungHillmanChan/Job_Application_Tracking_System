const nodemailer = require('nodemailer');
const logger = require('./logger');

const sendEmail = async (options) => {
  // Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Define email options
  const mailOptions = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    text: options.message
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw new Error('Email could not be sent');
  }
};

module.exports = sendEmail;