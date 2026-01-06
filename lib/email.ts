import nodemailer from 'nodemailer';

// Email service configuration
interface EmailConfig {
  provider: 'nodemailer' | 'zeptomail';
  nodemailer?: {
    host: string;
    port: number;
    secure: boolean;
    auth: {
      user: string;
      pass: string;
    };
  };
  zeptomail?: {
    apiKey: string;
    baseUrl?: string;
  };
}

// Get email configuration from environment
export function getEmailConfig(): EmailConfig {
  const provider =
    (process.env.EMAIL_PROVIDER as 'nodemailer' | 'zeptomail') || 'nodemailer';

  if (provider === 'zeptomail') {
    return {
      provider: 'zeptomail',
      zeptomail: {
        apiKey: process.env.ZEPTOMAIL_API_KEY!,
        baseUrl:
          process.env.ZEPTOMAIL_BASE_URL || 'https://api.zeptomail.com/v1.1',
      },
    };
  }

  return {
    provider: 'nodemailer',
    nodemailer: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    },
  };
}

// Create nodemailer transporter
export function createNodemailerTransporter() {
  const config = getEmailConfig();

  if (config.provider !== 'nodemailer' || !config.nodemailer) {
    throw new Error('Nodemailer configuration not found');
  }

  return nodemailer.createTransport(config.nodemailer);
}

// Send email via nodemailer
async function sendEmailViaNodemailer(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  const transporter = createNodemailerTransporter();

  const result = await transporter.sendMail({
    from: `Blogkit Team" <noreply@macroscope.so>`,
    to,
    subject,
    html,
    text,
  });

  return result;
}

// Send email via zeptomail
async function sendEmailViaZeptomail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  const config = getEmailConfig();

  if (config.provider !== 'zeptomail' || !config.zeptomail) {
    throw new Error('Zeptomail configuration not found');
  }

  const response = await fetch(`${config.zeptomail.baseUrl}/email`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Zoho-enczapikey ${config.zeptomail.apiKey}`,
    },
    body: JSON.stringify({
      from: {
        address: process.env.EMAIL_FROM || 'noreply@yourdomain.com',
        name: process.env.EMAIL_FROM_NAME || 'Blog Bowl',
      },
      to: [
        {
          email_address: {
            address: to,
          },
        },
      ],
      subject,
      htmlbody: html,
      textbody: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Zeptomail error: ${error}`);
  }

  return response.json();
}

// Main email sending function
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
) {
  const config = getEmailConfig();

  try {
    if (config.provider === 'zeptomail') {
      return await sendEmailViaZeptomail(to, subject, html, text);
    } else {
      return await sendEmailViaNodemailer(to, subject, html, text);
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// Generate OTP
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';

  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }

  return otp;
}

// OTP email template
export function createOTPEmailTemplate(
  otp: string,
  userName?: string,
  isNewUser: boolean = false
): { html: string; text: string } {
  const welcomeMessage = isNewUser
    ? "Welcome to BlogKit! We're creating your account."
    : `Welcome back${userName ? `, ${userName}` : ''}!`;

  const instructionMessage = isNewUser
    ? 'Use the following code to complete your account setup:'
    : 'Use the following code to sign in to your Blogkit account:';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your OTP Code</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .otp-code { background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-number { font-size: 32px; font-weight: bold; color: #000; letter-spacing: 8px; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .welcome { color: #28a745; font-weight: 500; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Blog Kit</h1>
        </div>
        <div class="content">
          <h2>${isNewUser ? 'Welcome to Blog Kit!' : 'Your Login Code'}</h2>
          <p class="welcome">${welcomeMessage}</p>
          <p>${instructionMessage}</p>
          
          <div class="otp-code">
            <div class="otp-number">${otp}</div>
          </div>
          
          <p><strong>This code will expire in 10 minutes.</strong></p>
          <p>If you didn't request this code, please ignore this email.</p>
          
          ${
            isNewUser
              ? '<p>After verification, you can start creating your first workspace and blog!</p>'
              : ''
          }
        </div>
        <div class="footer">
          <p>&copy; 2025 Blog Kit. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    ${isNewUser ? 'Welcome to Blog Kit!' : 'Your Blog Kit Login Code'}
    
    ${welcomeMessage}
    
    ${instructionMessage}
    
    ${otp}
    
    This code will expire in 10 minutes.
    
    If you didn't request this code, please ignore this email.
    
    ${
      isNewUser
        ? 'After verification, you can start creating your first workspace and blog!'
        : ''
    }
    
    © 2025 Blog Kit. All rights reserved.
  `;

  return { html, text };
}

// Team invitation email template
export function createTeamInviteEmailTemplate(
  workspaceName: string,
  workspaceSlug: string,
  role: string,
  inviterName: string
): { html: string; text: string } {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>You're now part of ${workspaceName}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; margin: 0; padding: 0; background-color: #f6f6f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background-color: #000; color: white; padding: 20px; text-align: center; }
        .content { padding: 40px 20px; }
        .workspace-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 12px; padding: 24px; text-align: center; margin: 20px 0; }
        .workspace-name { font-size: 24px; font-weight: bold; color: #000; margin-bottom: 8px; }
        .role-badge { background-color: #007bff; color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; text-transform: capitalize; display: inline-block; }
        .cta-button { background-color: #000; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; margin: 24px 0; font-weight: 500; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 14px; }
        .quick-access { background-color: #e3f2fd; border: 1px solid #bbdefb; padding: 16px; border-radius: 8px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Blog Kit</h1>
        </div>
        <div class="content">
          <h2>🎉 You're now part of a team!</h2>
          <p><strong>${inviterName}</strong> added you to their workspace:</p>
          
          <div class="workspace-box">
            <div class="workspace-name">${workspaceName}</div>
            <div class="role-badge">${role.toLowerCase()}</div>
          </div>
          
          <div class="quick-access">
            <p style="margin: 0; font-weight: 500; color: #1565c0;">✨ You can start collaborating right away!</p>
            <p style="margin: 8px 0 0 0; font-size: 14px; color: #1976d2;">Sign in to access your new workspace and start creating content together.</p>
          </div>
          
          <div style="text-align: center;">
            <a  href="${
              process.env.NEXTAUTH_URL
            }/${workspaceSlug}" class="cta-button">
              Open Workspace
            </a>
          </div>
          
          <p style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px;">
            Or visit: <a href="${
              process.env.NEXTAUTH_URL
            }/${workspaceSlug}" style="color: #007bff;">${
    process.env.NEXTAUTH_URL
  }/${workspaceSlug}</a>



          </p>
        
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #dee2e6;">
          
          <p style="color: #6c757d; font-size: 14px; text-align: center;">
            You received this email because ${inviterName} added you to their ${workspaceName} workspace.
          </p>
        </div>
        <div class="footer">
          <p>&copy; 2025 Blog Kit. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    🎉 You're now part of a team!
    
    ${inviterName} added you to their workspace: ${workspaceName}
    
    Role: ${role}
    
    ✨ You can start collaborating right away!
    Sign in to access your new workspace: ${process.env.NEXTAUTH_URL}/${workspaceSlug}
    
    You received this email because ${inviterName} added you to their ${workspaceName} workspace.
    
    © 2025 Blog Kit. All rights reserved.
  `;

  return { html, text };
}
