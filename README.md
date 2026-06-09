# OneCrack Test Portal

A professional academic testing platform built with Next.js, Firebase, and Genkit AI.

## 🚀 Deployment Instructions

### 1. Link to GitHub
Run these commands in your terminal to push your code:
```bash
git init
git add .
git commit -m "Initial commit: OneCrack Test Portal"
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2. Environment Variables (Netlify/Firebase)
In your dashboard, add the following keys to enable AI and Emails securely:

| Key | Purpose |
| :--- | :--- |
| `GEMINI_API_KEY` | Powers AI Question Import & Study Plans |
| `SMTP_USER` | Email address for sending reports |
| `SMTP_PASS` | App Password for secure SMTP sending |
| `ADMIN_PASSCODE` | The master code for accessing /admin |

## Features
- **Forensic AI Extraction**: Automatically parses JEE/NEET questions with 4-digit option codes.
- **High-Integrity Interface**: Real-time signal monitoring and anti-cheat tracking.
- **Virtually Certified Reports**: Professional, printable performance audits.
