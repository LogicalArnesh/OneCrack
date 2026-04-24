
# OneCrack Test Portal

A professional academic testing platform built with Next.js, Firebase, and Genkit AI.

## 🚀 How to push to GitHub

Run these commands one by one in your terminal:

1. **Initialize Git**:
   ```bash
   git init
   ```

2. **Add all files**:
   ```bash
   git add .
   ```

3. **Commit the changes**:
   ```bash
   git commit -m "Initial commit: OneCrack Test Portal"
   ```

4. **Link to GitHub**:
   ```bash
   git remote add origin https://github.com/LogicalArnesh/OneCrack.git
   ```

5. **Push to Main**:
   ```bash
   git push -u origin main
   ```

## 🔄 How to push UPDATES

If you have already pushed once and want to update the repo with new fixes:

1. `git add .`
2. `git commit -m "Implement professional email system and custom UIDs"`
3. `git push origin main`

## 🌐 Deployment to Netlify

Once your code is on GitHub, follow these steps to go live:

1. **Connect to Netlify**: Log in to Netlify and select **"Add new site" > "Import from Git"**.
2. **Environment Variables**: In the Netlify Dashboard (**Site Settings > Environment Variables**), add:
   - `GEMINI_API_KEY`: Your Google AI Key
   - `SMTP_USER`: `onecracktestportal@gmail.com`
   - `SMTP_PASS`: `bgng slvy xkow zyii` (Google App Password)

## 👤 Special Accounts
- **Admin Access**: 
  - UID: `admin`
  - Passcode: `0008`

## Features
- **Custom Login UID**: Students choose their own unique identifier for faster login.
- **Secure Portal**: Firebase Auth & Firestore based secure login with View/Hide password functionality.
- **AI Question Importer**: Admin can upload documents to extract questions via Genkit.
- **Automated Digital Reports**: Professional performance analysis sent directly to registered emails via SMTP.
- **Professional Analytics**: High-fidelity result dashboards with Recharts.
