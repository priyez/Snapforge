import type { FastifyInstance } from "fastify";
import { prisma } from "@screenshot-api/db";
import type { Env } from "../config/env.js";

// ── Google OAuth Endpoints ──────────────────────────────────────

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

// ── GitHub OAuth Endpoints ──────────────────────────────────────

const GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize";
const GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token";
const GITHUB_USER_URL = "https://api.github.com/user";
const GITHUB_EMAILS_URL = "https://api.github.com/user/emails";

// ── Helpers ─────────────────────────────────────────────────────

async function upsertOAuthUser(
  provider: string,
  providerAccountId: string,
  email: string,
  name: string | null,
  avatarUrl: string | null
) {
  // Check if user exists with this email
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email,
        name,
        avatarUrl,
      },
    });
  } else if (avatarUrl && !user.avatarUrl) {
    // Update avatar if missing
    user = await prisma.user.update({
      where: { id: user.id },
      data: { avatarUrl },
    });
  }

  // Upsert the account link
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: { provider, providerAccountId },
    },
    update: { avatarUrl },
    create: {
      userId: user.id,
      provider,
      providerAccountId,
      avatarUrl,
    },
  });

  return user;
}

// ── Route Registration ──────────────────────────────────────────

export async function registerOAuthRoutes(app: FastifyInstance, env: Env) {
  const dashboardUrl = env.DASHBOARD_URL.replace(/\/$/, "");

  // ── Google OAuth ────────────────────────────────────────────
  const hasGoogle = env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET;

  if (env.GOOGLE_CLIENT_ID !== undefined) {
    const googleCallbackUrl = `${env.API_URL}/api/auth/callback/google`;

    // Redirect to Google consent screen  
    app.get("/api/auth/google", async (_request, reply) => {
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        return reply.redirect(`${dashboardUrl}/login?error=oauth_not_configured`);
      }

      const params = new URLSearchParams({
        client_id: env.GOOGLE_CLIENT_ID,
        redirect_uri: googleCallbackUrl,
        response_type: "code",
        scope: "openid email profile",
        access_type: "offline",
        prompt: "consent",
      });

      return reply.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
    });

    // Handle Google callback
    app.get("/api/auth/callback/google", async (request, reply) => {
      const { code } = request.query as { code?: string };

      if (!code) {
        return reply.redirect(`${dashboardUrl}/login?error=missing_code`);
      }

      try {
        // Exchange code for tokens
        const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: env.GOOGLE_CLIENT_ID!,
            client_secret: env.GOOGLE_CLIENT_SECRET!,
            redirect_uri: googleCallbackUrl,
            grant_type: "authorization_code",
          }),
        });

        const tokenData = (await tokenRes.json()) as {
          access_token?: string;
          error?: string;
        };

        if (!tokenData.access_token) {
          app.log.error({ tokenData }, "Google token exchange failed");
          return reply.redirect(`${dashboardUrl}/login?error=token_exchange_failed`);
        }

        // Fetch user profile
        const userRes = await fetch(GOOGLE_USERINFO_URL, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` },
        });

        const profile = (await userRes.json()) as {
          sub: string;
          email: string;
          name?: string;
          picture?: string;
        };

        if (!profile.email) {
          return reply.redirect(`${dashboardUrl}/login?error=no_email`);
        }

        // Upsert user and link account
        const user = await upsertOAuthUser(
          "google",
          profile.sub,
          profile.email,
          profile.name || null,
          profile.picture || null
        );

        // Sign JWT and redirect to dashboard
        const token = app.jwt.sign({ sub: user.id, email: user.email });
        return reply.redirect(`${dashboardUrl}/login?token=${token}`);
      } catch (err) {
        app.log.error({ err }, "Google OAuth callback error");
        return reply.redirect(`${dashboardUrl}/login?error=oauth_failed`);
      }
    });

    if (!hasGoogle) {
      app.log.warn("⚠️ Google OAuth routes registered but CLIENT_ID/SECRET are missing");
    } else {
      app.log.info("✅ Google OAuth routes registered");
    }
  }

  // ── GitHub OAuth ────────────────────────────────────────────
  const hasGithub = env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET;

  if (env.GITHUB_CLIENT_ID !== undefined) {
    const githubCallbackUrl = `${env.API_URL}/api/auth/callback/github`;

    // Redirect to GitHub consent screen
    app.get("/api/auth/github", async (_request, reply) => {
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        return reply.redirect(`${dashboardUrl}/login?error=oauth_not_configured`);
      }

      const params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: githubCallbackUrl,
        scope: "read:user user:email",
      });

      return reply.redirect(`${GITHUB_AUTH_URL}?${params.toString()}`);
    });

    // Handle GitHub callback
    app.get("/api/auth/callback/github", async (request, reply) => {
      const { code } = request.query as { code?: string };

      if (!code) {
        return reply.redirect(`${dashboardUrl}/login?error=missing_code`);
      }

      try {
        // Exchange code for access token
        const tokenRes = await fetch(GITHUB_TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID!,
            client_secret: env.GITHUB_CLIENT_SECRET!,
            code,
            redirect_uri: githubCallbackUrl,
          }),
        });

        const tokenData = (await tokenRes.json()) as {
          access_token?: string;
          error?: string;
        };

        if (!tokenData.access_token) {
          app.log.error({ tokenData }, "GitHub token exchange failed");
          return reply.redirect(`${dashboardUrl}/login?error=token_exchange_failed`);
        }

        // Fetch user profile
        const headers = {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: "application/json",
          "User-Agent": "SnapForge-API",
        };

        const userRes = await fetch(GITHUB_USER_URL, { headers });
        const profile = (await userRes.json()) as {
          id: number;
          login: string;
          name?: string;
          avatar_url?: string;
          email?: string;
        };

        // GitHub may not return email in profile — fetch from emails API
        let email = profile.email;
        if (!email) {
          const emailsRes = await fetch(GITHUB_EMAILS_URL, { headers });
          const emails = (await emailsRes.json()) as Array<{
            email: string;
            primary: boolean;
            verified: boolean;
          }>;
          const primary = emails.find((e) => e.primary && e.verified);
          email = primary?.email || emails[0]?.email;
        }

        if (!email) {
          return reply.redirect(`${dashboardUrl}/login?error=no_email`);
        }

        // Upsert user and link account
        const user = await upsertOAuthUser(
          "github",
          String(profile.id),
          email,
          profile.name || profile.login,
          profile.avatar_url || null
        );

        // Sign JWT and redirect to dashboard
        const token = app.jwt.sign({ sub: user.id, email: user.email });
        return reply.redirect(`${dashboardUrl}/login?token=${token}`);
      } catch (err) {
        app.log.error({ err }, "GitHub OAuth callback error");
        return reply.redirect(`${dashboardUrl}/login?error=oauth_failed`);
      }
    });

    if (!hasGithub) {
      app.log.warn("⚠️ GitHub OAuth routes registered but CLIENT_ID/SECRET are missing");
    } else {
      app.log.info("✅ GitHub OAuth routes registered");
    }
  }
}
