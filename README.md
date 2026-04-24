# OneCrack Test Portal

A professional academic testing platform built with Next.js, Firebase, and Genkit AI.

## Deployment to Netlify

1. **Push your code** to a GitHub/GitLab/Bitbucket repository.
2. **Connect to Netlify**: Create a new site from your Git provider.
3. **Environment Variables**: In the Netlify Dashboard (Site Settings > Environment Variables), you MUST add the following:
   - `GEMINI_API_KEY`: Your Google AI API Key for Genkit AI features (Study Plan & Question Import).
   - `FIREBASE_SERVICE_ACCOUNT`: (Optional) If you use admin SDK features.
4. **Build Settings**: Netlify should automatically detect Next.js. If not:
   - Build Command: `npm run build`
   - Publish Directory: `.next`

## Local Development

```bash
npm install
npm run dev
```

## Features
- **Secure Portal**: Student UID and passcode-based authentication.
- **AI Question Importer**: Admin can upload PDFs to extract questions.
- **AI Personal Mentor**: Personalized study plans based on performance.
- **Professional Analytics**: High-fidelity result dashboards with charts.
