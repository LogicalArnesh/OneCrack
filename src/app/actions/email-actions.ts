
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

export async function sendWelcomeEmail(toEmail: string, userName: string, loginUid: string) {
  if (!toEmail) return;

  const mailOptions = {
    from: `"${APP_CONFIG.EMAILS.SENDER_NAME}" <${APP_CONFIG.EMAILS.SENDER_ADDRESS}>`,
    to: toEmail,
    subject: `Welcome to ${APP_CONFIG.NAME} - Account Verified`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #f97316;">Welcome, ${userName}!</h2>
        <p>Your account on the <strong>OneCrack Test Portal</strong> has been successfully created.</p>
        <p>You can now login using your unique ID:</p>
        <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; font-weight: bold; font-family: monospace; font-size: 18px; color: #333; text-align: center;">
          ${loginUid}
        </div>
        <p style="margin-top: 20px;">Use this ID and your passcode to access your tests and study plans.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

export async function sendTestReportEmail(toEmail: string, userName: string, resultData: any) {
  if (!toEmail) return;

  const mailOptions = {
    from: `"${APP_CONFIG.EMAILS.SENDER_NAME}" <${APP_CONFIG.EMAILS.SENDER_ADDRESS}>`,
    to: toEmail,
    subject: `Performance Report: ${resultData.testTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #f97316;">Evaluation Summary</h2>
        <p>Hello ${userName},</p>
        <p>Your results for <strong>${resultData.testTitle}</strong> are ready.</p>
        
        <div style="display: flex; gap: 10px; margin: 20px 0;">
          <div style="flex: 1; background: #fff7ed; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #ffedd5;">
            <p style="margin: 0; font-size: 12px; color: #9a3412; font-weight: bold;">ACCURACY</p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: 900; color: #ea580c;">${resultData.percentage}%</p>
          </div>
          <div style="flex: 1; background: #f0fdf4; padding: 15px; border-radius: 10px; text-align: center; border: 1px solid #dcfce7;">
            <p style="margin: 0; font-size: 12px; color: #166534; font-weight: bold;">SCORE</p>
            <p style="margin: 5px 0 0; font-size: 24px; font-weight: 900; color: #16a34a;">${resultData.score}/${resultData.maxScore}</p>
          </div>
        </div>

        <p>Login to the portal to view the detailed question-wise analysis and pedagogical feedback.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888;">ID: ${resultData.submissionId}</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Error sending report email:', error);
    return { success: false, error };
  }
}
