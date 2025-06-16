import nodemailer from 'nodemailer';
import { ApiError } from './verificationService';

export class EmailService {
  private transporter: nodemailer.Transporter;
  constructor() {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Missing email configuration. Please check .env file.');
    }    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS?.replace(/\s/g, ''), // Remove any spaces from password
      }
    });

    console.log('Email service initialized with Gmail configuration');
  }
  async sendVerificationCode(email: string, code: string): Promise<void> {
    try {
      console.log('Preparing to send verification code to:', email);
      console.log('SMTP Configuration:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        // Not logging password for security
        from: process.env.SMTP_FROM
      });

      // First verify the connection
      try {
        await this.transporter.verify();
        console.log('SMTP connection verified successfully');
      } catch (verifyError) {
        console.error('SMTP connection verification failed:', verifyError);
        throw verifyError;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Your Verification Code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <div style="background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0;">
              <p style="text-align: center; margin-bottom: 20px;">Your verification code is:</p>
              <div style="background-color: #ffffff; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; border-radius: 5px; border: 1px solid #dee2e6;">
                ${code}
              </div>
              <p style="text-align: center; margin-top: 20px;">This code will expire in 10 minutes.</p>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center; margin-top: 20px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
        `,
      };

      console.log('Sending verification email...');
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', {
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected
      });
    } catch (error) {
      console.error('Detailed error sending verification email:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error
      });
      if (error instanceof Error) {
        throw new ApiError(`Failed to send verification email: ${error.message}`, 500);
      }
      throw new ApiError('Failed to send verification email', 500);
    }
  }
}
