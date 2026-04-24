
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
    subject: `Welcome to ${APP_CONFIG.NAME} - Account Verified`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 20px;">
        <h2 style="color: #f97316; margin-bottom: 20px;">Hello ${userName},</h2>
        <p>Your professional testing account has been successfully registered.</p>
        
        <div style="background: #fdf2f2; border: 1px solid #fee2e2; padding: 20px; border-radius: 12px; margin: 25px 0;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #991b1b;">Student Credentials</p>
          <p style="margin: 5px 0;"><strong>Login UID:</strong> ${loginUid}</p>
          <p style="margin: 5px 0;"><strong>Enrolled Class:</strong> Class ${classLevel}</p>
          <p style="margin: 5px 0;"><strong>Stream:</strong> ${subject}</p>
        </div>

        <p>Use your unique ID and passcode to access your tests and AI study plans.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://${APP_CONFIG.DOMAIN}/auth/login" style="background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Login to Dashboard</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #888; text-align: center;">This is a system-generated message from ${APP_CONFIG.NAME}.</p>
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
    subject: `Performance Analysis: ${resultData.testTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 20px;">
        <h2 style="color: #f97316; margin-bottom: 10px;">Evaluation Summary</h2>
        <p>Hello ${userName}, your results for <strong>${resultData.testTitle}</strong> are ready.</p>
        
        <div style="display: flex; gap: 15px; margin: 25px 0;">
          <div style="flex: 1; background: #f0fdf4; padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #dcfce7;">
            <p style="margin: 0; font-size: 11px; color: #166534; font-weight: bold; letter-spacing: 1px;">AGGREGATE SCORE</p>
            <p style="margin: 5px 0 0; font-size: 32px; font-weight: 900; color: #16a34a;">${resultData.score}/${resultData.maxScore}</p>
          </div>
          <div style="flex: 1; background: #fff7ed; padding: 20px; border-radius: 15px; text-align: center; border: 1px solid #ffedd5;">
            <p style="margin: 0; font-size: 11px; color: #9a3412; font-weight: bold; letter-spacing: 1px;">ACCURACY</p>
            <p style="margin: 5px 0 0; font-size: 32px; font-weight: 900; color: #ea580c;">${resultData.percentage}%</p>
          </div>
        </div>

        <p style="color: #666; font-size: 14px; line-height: 1.6;">You can access the deep-dive analysis, pedagogical feedback, and AI study roadmap through the link below.</p>
        
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://${APP_CONFIG.DOMAIN}/dashboard/results/${resultData.submissionId}" style="background: #111; color: white; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Access Full Analysis</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 11px; color: #888;">Submission Reference ID: ${resultData.submissionId}</p>
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
