/**
 * Application Configuration
 * All sensitive values are moved to environment variables for security.
 */
export const APP_CONFIG = {
  NAME: 'OneCrack Test Portal',
  DOMAIN: 'onecrack.netlify.app', 
  EMAILS: {
    SENDER_NAME: 'OneCrack Evaluation Engine',
    SENDER_ADDRESS: process.env.NEXT_PUBLIC_SMTP_USER || 'onecracktestportal@gmail.com',
    REPLY_TO: process.env.NEXT_PUBLIC_SMTP_USER || 'onecracktestportal@gmail.com',
  },
  ADMIN: {
    UID: 'admin',
    // Default fallback (only for dev), always use process.env.ADMIN_PASSCODE in production
    PASSCODE: process.env.NEXT_PUBLIC_ADMIN_PASSCODE || '000008',
    EMAIL: process.env.NEXT_PUBLIC_SMTP_USER || 'onecracktestportal@gmail.com'
  }
};