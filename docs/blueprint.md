# **App Name**: OneCrack Test Portal

## Core Features:

- User Authentication & Registration: Secure login using UID and passcode, user registration including name, UID, passcode, class, subject. Implement 'Forgot UID' and 'Forgot Passcode' functionalities. Email is optional but recommended for recovery and notifications.
- User Profile Management: Users can view and securely update their passcode and UID from their profile, requiring current credentials for verification. Email notifications confirm successful changes if provided.
- User Dashboard & Navigation: Display available tests, show a history of past test results, and provide a 'Help/Support' option that notifies administrators. The interface will feature the portal name/logo on the top right and user profile details on the bottom left.
- Test Taking Interface: A focused interface for taking tests, presenting questions one at a time. Includes an interactive dashboard on the right for navigating between subjects and questions, displaying candidate name, current time, time remaining, and question statuses (attempted, never visited, marked for review, left).
- AI-Powered Question Import Tool (Admin): An administrator tool to import test questions (MCQ, Assertion-Reason, Image+MCQ, Short/Long Answer) from PDF or Word documents. The tool intelligently categorizes questions by class and subject upon import, saving them to the database.
- Test Administration (Admin): Admins can create and configure new tests, specifying class, subject, selecting questions from the database, assigning marks per question, defining marks for correct/wrong attempts, and setting total test time. All test data is stored persistently.
- Result Generation & Professional Display: Upon test completion, generate a comprehensive result report for the user, detailing scores, time taken, correct/wrong attempts, individual subject performance, submission ID, and more. This report is professionally displayed within the portal, includes interactive charts for detailed insights per question, and is available for download as a PDF with appropriate naming conventions. Admin can globally release results to all users.

## Style Guidelines:

- Color scheme: Dark. Embodying a professional, focused environment for academic testing.
- Primary color: Rich, warm orange (#EC7E2B). This will be used for interactive elements, key highlights, and branding accents to convey vibrancy and clarity.
- Background color: Deep, desaturated reddish-brown (#231E1D). Providing a professional, calm, and dark backdrop for optimal focus during tests and result analysis.
- Accent color: Vibrant yellow-orange (#FEE73A). Utilized sparingly for high-contrast alerts, important notifications, and to draw attention to critical information without being distracting.
- Headlines and prominent text: 'Space Grotesk' (sans-serif). A modern, tech-inspired font that ensures readability for titles and short instructional text.
- Body text and detailed information: 'Inter' (sans-serif). Chosen for its high legibility and versatility, ensuring that questions, results, and explanatory content are easily readable over extended periods.
- Use professional, clean, and minimalist icons to represent key actions and information (e.g., login, profile, tests, results, help), maintaining a consistent visual language.
- Implement a structured and intuitive layout with a clear hierarchy. The test-taking interface will feature a multi-panel design, separating questions from navigation and real-time statistics for optimal user experience.
- Incorporate subtle, non-intrusive animations for feedback on user actions (e.g., button clicks, test submission) and smooth transitions between pages or sections to enhance the user experience without causing distraction.