import { trpcServer } from "@hono/trpc-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono();

app.use("*", cors());

app.use(
  "/api/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  }),
);

app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

app.get("/privacy-policy", (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - Daily Habit Tracker</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f7;
            padding: 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            padding: 40px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; color: #1d1d1f; }
        .last-updated { color: #86868b; font-size: 14px; margin-bottom: 32px; }
        h2 { font-size: 22px; font-weight: 600; margin-top: 32px; margin-bottom: 16px; color: #1d1d1f; }
        p, li { color: #424245; margin-bottom: 12px; }
        ul { padding-left: 24px; margin-bottom: 16px; }
        li { margin-bottom: 8px; }
        .highlight {
            background-color: #f0f0f5;
            padding: 16px 20px;
            border-radius: 12px;
            margin: 20px 0;
        }
        .contact-info { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; }
        a { color: #0066cc; text-decoration: none; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Privacy Policy</h1>
        <p class="last-updated">Last Updated: January 10, 2026</p>

        <p>Daily Habit Tracker ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and protect your information when you use our mobile application.</p>

        <div class="highlight">
            <strong>Summary:</strong> We store all your data locally on your device. We do not collect, transmit, or share your personal information with any third parties.
        </div>

        <h2>1. Information We Collect</h2>
        <p>Daily Habit Tracker stores the following information <strong>locally on your device only</strong>:</p>
        <ul>
            <li><strong>Account Information:</strong> Email address and password (encrypted)</li>
            <li><strong>Habits Data:</strong> Your habits, completion records, streaks, and notes</li>
            <li><strong>Tasks Data:</strong> Your tasks, due dates, and completion status</li>
            <li><strong>Projects Data:</strong> Your project names and associated tasks</li>
            <li><strong>Daily Notes:</strong> Any notes you write within the app</li>
            <li><strong>Inbox Items:</strong> Brain dump thoughts and items saved for later</li>
        </ul>

        <h2>2. Device Permissions</h2>
        <ul>
            <li><strong>Face ID:</strong> For secure app access. Biometric data is processed by your device and never accessed by our app.</li>
            <li><strong>Microphone:</strong> For voice-to-text input when adding tasks or notes. Audio is processed locally and not recorded.</li>
            <li><strong>Notifications:</strong> For habit reminders you configure.</li>
        </ul>

        <h2>3. Data Storage</h2>
        <p>All data is stored locally on your device. Sensitive data is stored in iOS Keychain / Android Keystore. We do not have access to your data and it is never transmitted to external servers.</p>

        <h2>4. Data Sharing</h2>
        <p>We do not share, sell, or transfer your personal information to any third parties.</p>

        <h2>5. Data Security</h2>
        <ul>
            <li>Passwords are encrypted using bcrypt hashing</li>
            <li>Auth tokens use platform-native secure storage</li>
            <li>Biometric authentication available</li>
        </ul>

        <h2>6. Data Deletion</h2>
        <p>Delete your data anytime by logging out or uninstalling the app.</p>

        <h2>7. Children's Privacy</h2>
        <p>Our app does not knowingly collect personal information from children under 13.</p>

        <h2>8. Third-Party Services</h2>
        <p>We do not use any third-party analytics, advertising, or tracking services.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date.</p>

        <h2>10. Your Rights</h2>
        <p>You have complete control over your data. Access, modify, or delete it anytime within the app.</p>

        <div class="contact-info">
            <h2>Contact Us</h2>
            <p>Questions? Contact us at: <a href="mailto:support@daily-habit-tracker.app">support@daily-habit-tracker.app</a></p>
        </div>
    </div>
</body>
</html>`;
  return c.html(html);
});

export default app;
