# OAuth Setup Guide

This guide explains how to obtain the necessary credentials to enable Google and GitHub authentication for the Screenshot API platform.

## 1. GitHub OAuth Setup

1.  Log in to your [GitHub account](https://github.com/).
2.  Navigate to **Settings** (click your profile picture in the top right).
3.  On the left sidebar, scroll down and click **Developer settings**.
4.  Click **OAuth Apps** > **New OAuth App**.
5.  Fill in the application details:
    *   **Application name**: `SnapForge (Local)` (or your preferred name)
    *   **Homepage URL**: `http://localhost:3300`
    *   **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
6.  Click **Register application**.
7.  Copy the **Client ID**.
8.  Click **Generate a new client secret** and copy it immediately (it won't be shown again).
9.  Update your `.env` file:
    ```bash
    GITHUB_CLIENT_ID=your_client_id
    GITHUB_CLIENT_SECRET=your_client_secret
    ```

---

## 2. Google OAuth Setup

1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new project (or select an existing one).
3.  Navigate to **APIs & Services** > **OAuth consent screen**.
4.  Select **External** and click **Create**.
5.  Fill in the required App Information (App name, User support email, Developer contact info).
6.  Click **Save and Continue** through the Scopes and Test Users sections (add your own email as a test user).
7.  Navigate to **APIs & Services** > **Credentials**.
8.  Click **Create Credentials** > **OAuth client ID**.
9.  Select **Web application** as the Application type.
10. Fill in the details:
    *   **Name**: `SnapForge (Local)`
    *   **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google`
11. Click **Create**.
12. A modal will appear with your **Client ID** and **Client Secret**.
13. Update your `.env` file:
    ```bash
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    ```

---

## 3. Important Notes

*   **Ports**: Ensure the callback URLs match the `PORT` defined in your `.env` (default is `3000`).
*   **Production**: When deploying to production, you must create NEW OAuth applications with your production domain (e.g., `https://api.yourdomain.com/api/auth/callback/google`).
*   **DASHBOARD_URL**: Ensure your `DASHBOARD_URL` in `.env` is set to `http://localhost:3300` so the API knows where to redirect the user after a successful login.
