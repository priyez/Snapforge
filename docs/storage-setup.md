# Cloudflare R2 Storage Setup Guide

This guide explains how to set up Cloudflare R2 for production-ready screenshot storage.

## 1. Create an R2 Bucket

1.  Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  On the left sidebar, click **R2**.
3.  Click **Create bucket**.
4.  Give your bucket a name (e.g., `screenshots`).
5.  Click **Create bucket**.
6.  Update your `.env`:
    ```bash
    R2_BUCKET=screenshots
    ```

## 2. Get your Account ID

1.  Navigate back to the main **R2** overview page.
2.  On the right side of the page, you will see your **Account ID**.
3.  Copy it and update your `.env`:
    ```bash
    R2_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com
    ```

## 3. Create API Credentials

1.  On the R2 overview page, click **Manage R2 API Tokens** (on the right sidebar).
2.  Click **Create API token**.
3.  Token name: `SnapForge Storage`.
4.  Permissions: **Object Read & Write** (or "Admin Read & Write" if you want full control).
5.  Scope: You can restrict it to specific buckets if preferred.
6.  Click **Create API Token**.
7.  Copy the **Access Key ID** and **Secret Access Key** immediately.
8.  Update your `.env`:
    ```bash
    R2_ACCESS_KEY_ID=your_access_key_id
    R2_SECRET_ACCESS_KEY=your_secret_access_key
    ```

## 4. Enable Public Access (Optional but Recommended)

By default, R2 buckets are private. To allow users to view their screenshots via a URL, you need to enable public access.

1.  Go to your bucket settings in the R2 dashboard.
2.  Scroll down to **Public Access**.
3.  You have two options:
    *   **Custom Domain**: Connect a domain you own (e.g., `cdn.yourdomain.com`). This is recommended for production.
    *   **R2.dev Subdomain**: Enable the managed `r2.dev` subdomain for quick testing.
4.  Once enabled, copy the public URL and update your `.env`:
    ```bash
    R2_PUBLIC_URL=https://your-subdomain.r2.dev
    ```

## 5. Switch Storage Provider

Finally, tell the API to use R2 instead of local storage:
```bash
STORAGE_PROVIDER=r2
```

---

## Final .env Configuration Example

```bash
STORAGE_PROVIDER=r2
R2_ENDPOINT=https://abc123xyz789.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET=screenshots
R2_PUBLIC_URL=https://pub-abc.r2.dev
```
