const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Create HTML email template for password reset
 * @param {string} resetUrl - The password reset URL
 * @param {string} userName - The user's name
 * @returns {string} HTML email template
 */
const createPasswordResetTemplate = (resetUrl, userName) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset - JobTracker</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 24px;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .content {
                margin-bottom: 30px;
            }
            .button {
                display: inline-block;
                padding: 12px 30px;
                background-color: #2563eb;
                color: #ffffff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
                text-align: center;
                margin: 20px 0;
            }
            .button:hover {
                background-color: #1d4ed8;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eeeeee;
                font-size: 14px;
                color: #666666;
            }
            .warning {
                background-color: #fef3cd;
                border: 1px solid #fde047;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .expiry {
                color: #dc2626;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">JobTracker</div>
                <h1>Password Reset Request</h1>
            </div>
            
            <div class="content">
                <p>Hello ${userName || 'there'},</p>
                
                <p>We received a request to reset your password for your JobTracker account. If you made this request, click the button below to reset your password:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                
                <div class="warning">
                    <p><strong>⚠️ Important Security Information:</strong></p>
                    <ul>
                        <li>This password reset link will <span class="expiry">expire in 10 minutes</span></li>
                        <li>If you didn't request this password reset, please ignore this email</li>
                        <li>For security reasons, never share this link with anyone</li>
                    </ul>
                </div>
                
                <p>If the button above doesn't work, you can copy and paste the following link into your browser:</p>
                <p style="word-break: break-all; background-color: #f8f9fa; padding: 10px; border-radius: 5px; font-family: monospace;">
                    ${resetUrl}
                </p>
                
                <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
            </div>
            
            <div class="footer">
                <p>Best regards,<br>The JobTracker Team</p>
                <p style="font-size: 12px; margin-top: 15px;">
                    This is an automated message. Please do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>
  `;
};

/**
 * Create text version of password reset email (fallback)
 * @param {string} resetUrl - The password reset URL
 * @param {string} userName - The user's name
 * @returns {string} Plain text email
 */
const createPasswordResetTextTemplate = (resetUrl, userName) => {
  return `
JobTracker - Password Reset Request

Hello ${userName || 'there'},

We received a request to reset your password for your JobTracker account.

To reset your password, please visit the following link:
${resetUrl}

IMPORTANT SECURITY INFORMATION:
- This password reset link will expire in 10 minutes
- If you didn't request this password reset, please ignore this email
- For security reasons, never share this link with anyone

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Best regards,
The JobTracker Team

---
This is an automated message. Please do not reply to this email.
  `;
};


const sendEmail = async (options) => {
  try {
    // Create transporter with better error handling
    let transporter;
    
    if (process.env.NODE_ENV === 'development') {
      // For development, you can use a test email service like Ethereal
      transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    } else {
      // Production email service
      transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });
    }

    // Verify transporter configuration
    await transporter.verify();
    logger.info('Email transporter verified successfully');

    let mailOptions = {
      from: `${process.env.FROM_NAME || 'JobTracker'} <${process.env.FROM_EMAIL || 'noreply@jobtracker.com'}>`,
      to: options.email,
      subject: options.subject,
    };

    // Handle different email types
    if (options.type === 'password-reset' && options.resetUrl) {
      mailOptions.html = createPasswordResetTemplate(options.resetUrl, options.userName);
      mailOptions.text = createPasswordResetTextTemplate(options.resetUrl, options.userName);
    } else {
      // General email
      mailOptions.text = options.message;
      if (options.html) {
        mailOptions.html = options.html;
      }
    }

    // Send email
    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent successfully: ${info.messageId}`);
    
    if (process.env.NODE_ENV === 'development' && info.previewURL) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
    };
    
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    logger.error(`Email configuration: HOST=${process.env.SMTP_HOST}, PORT=${process.env.SMTP_PORT}`);
    
    // Provide more specific error messages
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your SMTP credentials.');
    } else if (error.code === 'ECONNECTION') {
      throw new Error('Could not connect to email server. Please check your SMTP settings.');
    } else if (error.code === 'EMESSAGE') {
      throw new Error('Invalid email message format.');
    } else {
      throw new Error(`Email could not be sent: ${error.message}`);
    }
  }
};

const sendPasswordResetEmail = async (email, resetUrl, userName) => {
  return await sendEmail({
    email,
    subject: 'Password Reset Request - JobTracker',
    type: 'password-reset',
    resetUrl,
    userName
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  createPasswordResetTemplate,
  createPasswordResetTextTemplate
};