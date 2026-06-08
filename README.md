# OneCrack Test Portal

A professional academic testing platform built with Next.js, Firebase, and Genkit AI.

## 🚀 Deployment Instructions

### 1. Link to GitHub
Run these commands in your terminal:
```bash
git init
git add .
git commit -m "Initial commit: OneCrack Test Portal"
git remote add origin https://github.com/LogicalArnesh/OneCrack.git
git push -u origin main
```

### 2. Environment Variables (Netlify)
In the Netlify Dashboard (**Site Settings > Environment Variables**), add the following:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | *Your key from [Google AI Studio](https://aistudio.google.com/)* | Powers AI Question Import & Study Plans |
| `SMTP_USER` | `onecracktestportal@gmail.com` | Sender address for test reports |
| `SMTP_PASS` | `bgng slvy xkow zyii` | Gmail App Password for secure sending |

### 👤 Admin Access
- **Email**: `onecracktestportal@gmail.com`
- **Passcode**: `000008`

## Features
- **Custom Student UID**: Students choose their own unique identifier for faster login.
- **Secure Portal**: Firebase Auth & Firestore based secure login with View/Hide password functionality.
- **AI Question Importer**: Admin can upload documents to extract questions via Genkit.
- **Automated Reports**: Professional performance analysis sent directly to registered emails via SMTP.
- **JEE-Adv Test Interface**: Professional palette, timing, and integrity monitoring.
