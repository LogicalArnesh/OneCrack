
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

## 🌐 Deployment to Netlify

Once your code is on GitHub, follow these steps to go live:

1. **Connect to Netlify**: Log in to Netlify and select **"Add new site" > "Import from Git"**.
2. **Environment Variables**: In the Netlify Dashboard, navigate to **Site Settings > Environment Variables** and add the following:

| Key | Value | Purpose |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | *Your key from [Google AI Studio](https://aistudio.google.com/)* | Powers AI Question Import & Study Plans |
| `SMTP_USER` | `onecracktestportal@gmail.com` | Sender address for test reports |
| `SMTP_PASS` | `bgng slvy xkow zyii` | Gmail App Password for secure sending |

3. **Deploy**: Click "Deploy Site". Netlify will automatically build the project using the settings in `netlify.toml`.

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
