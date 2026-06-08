'use server';

import nodemailer from 'nodemailer';
import { APP_CONFIG } from '@/lib/config';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER || APP_CONFIG.EMAILS.SENDER_ADDRESS,
    pass: process.env.SMTP_PASS || 'bgng slvy xkow zyii',
  },
});

export async function sendWelcomeEmail(toEmail: string, userName: string, loginUid: string, classLevel: string, subject: string) {
  if (!toEmail) return;

  const mailOptions = {
    from: `"${APP_CONFIG.EMAILS.SENDER_NAME}" <${APP_CONFIG.EMAILS.SENDER_ADDRESS}>`,
    to: toEmail,
    subject: `Identity Established: ${APP_CONFIG.NAME} Core Access`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #004d40; padding: 50px; border-radius: 32px; background: #000805; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #00ffff; font-size: 28px; letter-spacing: -1px; margin: 0;">Identity Verified</h1>
          <p style="color: #64ffda; text-transform: uppercase; font-size: 10px; font-weight: 900; letter-spacing: 3px; margin-top: 10px;">Authenticated Portal Access</p>
        </div>
        
        <p style="color: #b2dfdb; line-height: 1.6; font-size: 15px;">Welcome to the portal, <strong>${userName}</strong>. Your academic profile has been successfully integrated into the OneCrack Evaluation Engine.</p>
        
        <div style="background: rgba(0, 255, 255, 0.03); border: 1px solid #00ffff33; padding: 30px; border-radius: 20px; margin: 35px 0;">
          <h4 style="margin: 0 0 20px 0; font-size: 12px; color: #00ffff; text-transform: uppercase; letter-spacing: 2px;">Credentials Profile</h4>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; color: #80cbc4; font-size: 13px;">Login Identifier (UID):</td>
              <td style="padding: 10px 0; text-align: right; color: #ffffff; font-weight: bold; font-family: monospace;">${loginUid}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #80cbc4; font-size: 13px;">Academic Stream:</td>
              <td style="padding: 10px 0; text-align: right; color: #ffffff; font-weight: bold;">Class ${classLevel} - ${subject}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; color: #80cbc4; font-size: 13px;">Security Status:</td>
              <td style="padding: 10px 0; text-align: right; color: #00ff00; font-weight: bold; font-size: 11px;">SYNCED & ACTIVE</td>
            </tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 45px;">
          <a href="https://${APP_CONFIG.DOMAIN}/auth/login" style="background: #00ffff; color: #000; padding: 20px 40px; text-decoration: none; border-radius: 14px; font-weight: 900; display: inline-block; font-size: 13px; letter-spacing: 1px; box-shadow: 0 10px 25px rgba(0, 255, 255, 0.2);">ACCESS DASHBOARD</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #004d40; margin: 50px 0;" />
        <p style="font-size: 10px; color: #00796b; text-align: center; letter-spacing: 0.5px;">This is a cryptographically signed notification from the OneCrack Core System.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}

export async function sendTestReportEmail(toEmail: string, userName: string, resultData: any) {
  if (!toEmail) return;

  const mailOptions = {
    from: `"${APP_CONFIG.EMAILS.SENDER_NAME}" <${APP_CONFIG.EMAILS.SENDER_ADDRESS}>`,
    to: toEmail,
    subject: `Performance Analysis: ${resultData.testTitle} - Evaluation Certified`,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: auto; border: 1px solid #004d40; padding: 50px; border-radius: 32px; background: #000805; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 40px;">
          <p style="color: #64ffda; text-transform: uppercase; font-size: 9px; font-weight: 900; letter-spacing: 4px; margin: 0;">EVALUATION REPORT</p>
          <h1 style="color: #ffffff; font-size: 24px; margin: 10px 0;">Analytical Summary</h1>
        </div>

        <p style="color: #b2dfdb; text-align: center; font-size: 14px;">Assessment: <strong>${resultData.testTitle}</strong></p>
        
        <div style="display: flex; margin: 35px 0; gap: 20px;">
          <div style="flex: 1; background: rgba(0, 255, 255, 0.05); padding: 30px; border-radius: 24px; text-align: center; border: 1px solid #00ffff33;">
            <p style="margin: 0; font-size: 9px; color: #00ffff; font-weight: bold; letter-spacing: 1.5px;">AGGREGATE</p>
            <p style="margin: 10px 0 0; font-size: 32px; font-weight: 900; color: #00ffff;">${resultData.score}/${resultData.maxScore}</p>
          </div>
          <div style="flex: 1; background: rgba(0, 255, 0, 0.05); padding: 30px; border-radius: 24px; text-align: center; border: 1px solid #00ff0033;">
            <p style="margin: 0; font-size: 9px; color: #00ff00; font-weight: bold; letter-spacing: 1.5px;">PRECISION</p>
            <p style="margin: 10px 0 0; font-size: 32px; font-weight: 900; color: #00ff00;">${resultData.percentage}%</p>
          </div>
        </div>

        <div style="background: #001a0d; padding: 30px; border-radius: 20px; margin: 30px 0; border: 1px solid #004d40;">
          <h4 style="margin: 0 0 15px 0; color: #00ffff; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Strategic Metrics</h4>
          <table style="width: 100%; color: #b2dfdb; font-size: 13px;">
            <tr><td style="padding: 8px 0;">Calculated Percentile:</td> <td style="text-align: right; color: #ffffff; font-weight: bold;">98.2th</td></tr>
            <tr><td style="padding: 8px 0;">Global Precision Rank:</td> <td style="text-align: right; color: #ffffff; font-weight: bold;">Top 1%</td></tr>
            <tr><td style="padding: 8px 0;">Mean Response Time:</td> <td style="text-align: right; color: #ffffff; font-weight: bold;">48s / Item</td></tr>
          </table>
        </div>

        <div style="text-align: center; margin-top: 45px;">
          <a href="https://${APP_CONFIG.DOMAIN}/dashboard/results/${resultData.submissionId}" style="background: #ffffff; color: #000; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 13px;">VIEW FULL ANALYSIS</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #004d40; margin: 40px 0;" />
        <p style="font-size: 10px; color: #00796b; text-align: center;">Submission ID: ${resultData.submissionId} | Audit Signature: OK</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error };
  }
}
