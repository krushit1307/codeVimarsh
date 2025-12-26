const crypto = require('crypto');

class EmailService {
  constructor() {
    this.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  }

  // Send OTP email
  async sendOTPEmail(user) {
    console.log('='.repeat(50));
    console.log('OTP VERIFICATION EMAIL');
    console.log('='.repeat(50));
    console.log(`To: ${user.email}`);
    console.log(`Subject: Verify your Code Vimarsh account`);
    console.log(`Your OTP code is: ${user.otpCode}`);
    console.log(`This code will expire in 10 minutes.`);
    console.log('='.repeat(50));
    
    // In production, you would send a real email here
    // Example using Nodemailer:
    /*
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Verify your Code Vimarsh account - OTP',
      html: `
        <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <h2 style="color: #ff6b00;">Welcome to Code Vimarsh!</h2>
          <p>Hi ${user.firstName},</p>
          <p>Thank you for registering with Code Vimarsh. Please use the following OTP code to verify your email address:</p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #ff6b00; font-size: 32px; letter-spacing: 8px; margin: 0;">${user.otpCode}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <p>Best regards,<br>The Code Vimarsh Team</p>
        </div>
      `
    });
    */
    
    return { success: true, message: 'OTP sent successfully' };
  }

  // Send welcome email after OTP verification
  async sendWelcomeEmail(user) {
    console.log('='.repeat(50));
    console.log('WELCOME EMAIL');
    console.log('='.repeat(50));
    console.log(`To: ${user.email}`);
    console.log(`Subject: Welcome to Code Vimarsh!`);
    console.log('Your account has been successfully verified.');
    console.log('='.repeat(50));
    
    return { success: true, message: 'Welcome email sent' };
  }
}

module.exports = new EmailService();
