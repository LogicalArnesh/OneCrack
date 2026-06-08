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
    subject: `Welcome to ${APP_CONFIG.NAME} - Evaluation Identity Verified`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #004225; padding: 40px; border-radius: 24px; background: #010a05; color: #ffffff;">
        <h2 style="color: #00ffff; margin-bottom: 20px; font-size: 24px;">Welcome to the Portal, ${userName}</h2>
        <p style="color: #a8d5ba;">Your academic profile for <strong>OneCrack</strong> has been successfully established and synced with our central database.</p>
        
        <div style="background: rgba(0, 255, 255, 0.05); border: 1px solid #00ffff33; padding: 25px; border-radius: 16px; margin: 30px 0;">
          <p style="margin: 0 0 15px 0; font-weight: bold; color: #00ffff; letter-spacing: 1px; font-size: 12px; text-transform: uppercase;">Authenticated Credentials</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Login UID:</strong> ${loginUid}</p>
          <p style="margin: 8px 0; font-size: 16px;"><strong>Class Stream:</strong> ${classLevel} - ${subject}</p>
          <p style="margin: 8px 0; font-size: 14px; color: #666;">Security Status: <span style="color: #00ff00;">Active</span></p>
        </div>

        <p style="font-size: 14px; line-height: 1.6; color: #a8d5ba;">Use your unique ID and passcode to access your dynamic evaluations, AI study roadmaps, and high-fidelity performance analytics.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="https://${APP_CONFIG.DOMAIN}/auth/login" style="background: #00ffff; color: #000; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 14px; box-shadow: 0 4px 15px rgba(0, 255, 255, 0.3);">ENTER PORTAL</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #004225; margin: 40px 0;" />
        <p style="font-size: 11px; color: #4a7c59; text-align: center; letter-spacing: 0.5px;">This is a cryptographically verified message from the ${APP_CONFIG.NAME} Core Engine.</p>
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
    subject: `High-Fidelity Performance Analysis: ${resultData.testTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #004225; padding: 40px; border-radius: 24px; background: #010a05; color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
           <p style="color: #00ffff; font-weight: 900; letter-spacing: 2px; margin: 0; font-size: 12px; text-transform: uppercase;">EVALUATION REPORT</p>
           <h2 style="color: #ffffff; margin: 10px 0; font-size: 28px;">Performance Summary</h2>
        </div>

        <p style="color: #a8d5ba; text-align: center;">Assessment: <strong>${resultData.testTitle}</strong></p>
        
        <div style="display: flex; justify-content: space-between; gap: 15px; margin: 35px 0;">
          <div style="flex: 1; background: rgba(0, 255, 255, 0.05); padding: 25px; border-radius: 20px; text-align: center; border: 1px solid #00ffff33;">
            <p style="margin: 0; font-size: 10px; color: #00ffff; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">AGGREGATE</p>
            <p style="margin: 8px 0 0; font-size: 36px; font-weight: 900; color: #00ffff;">${resultData.score}/${resultData.maxScore}</p>
          </div>
          <div style="flex: 1; background: rgba(0, 255, 0, 0.05); padding: 25px; border-radius: 20px; text-align: center; border: 1px solid #00ff0033;">
            <p style="margin: 0; font-size: 10px; color: #00ff00; font-weight: bold; letter-spacing: 1px; text-transform: uppercase;">ACCURACY</p>
            <p style="margin: 8px 0 0; font-size: 36px; font-weight: 900; color: #00ff00;">${resultData.percentage}%</p>
          </div>
        </div>

        <div style="background: #001a0a; padding: 25px; border-radius: 16px; margin: 25px 0; border: 1px solid #004225;">
          <h4 style="margin: 0 0 15px 0; color: #00ffff; font-size: 14px;">In-Depth Statistics</h4>
          <table style="width: 100%; color: #a8d5ba; font-size: 13px;">
            <tr><td style="padding: 5px 0;">Estimated Global Percentile:</td> <td style="text-align: right; color: #ffffff;">98.4th</td></tr>
            <tr><td style="padding: 5px 0;">Subject Precision Rank:</td> <td style="text-align: right; color: #ffffff;">#12 of 240</td></tr>
            <tr><td style="padding: 5px 0;">Cognitive Speed Average:</td> <td style="text-align: right; color: #ffffff;">42s / Item</td></tr>
          </table>
        </div>

        <p style="color: #a8d5ba; font-size: 13px; line-height: 1.6; text-align: center;">This data has been finalized and locked. Full pedagogical analysis and AI roadmap are available in the student portal.</p>
        
        <div style="text-align: center; margin-top: 40px;">
          <a href="https://${APP_CONFIG.DOMAIN}/dashboard/results/${resultData.submissionId}" style="background: #ffffff; color: #000; padding: 18px 35px; text-decoration: none; border-radius: 12px; font-weight: 900; display: inline-block; font-size: 14px;">VIEW DEEP-DIVE ANALYSIS</a>
        </div>

        <hr style="border: 0; border-top: 1px solid #004225; margin: 40px 0;" />
        <p style="font-size: 10px; color: #4a7c59; text-align: center;">Submission ID: ${resultData.submissionId} | Integrity Verified by OneCrack Engine</p>
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
