import { describe, it, expect, vi } from "vitest";
import { buildApp } from "../app.js";
import { prisma } from "@screenshot-api/db";
import bcrypt from "bcrypt";

describe("Authentication API", () => {
  const env = {
    PORT: 3000,
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    STORAGE_PROVIDER: "local" as const,
    STORAGE_PATH: "./test-storage",
    DASHBOARD_URL: "http://localhost:3300",
    API_URL: "http://localhost:3000",
  };

  it("POST /api/auth/login — should login successfully with valid credentials", async () => {
    const app = await buildApp(env);
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Mock user lookup
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "user-123",
      email: "test@example.com",
      password: hashedPassword,
      name: "Test User",
      plan: "FREE",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "test@example.com",
        password: "password123",
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.token).toBeDefined();
    expect(body.data.user.email).toBe("test@example.com");
  });

  it("POST /api/auth/login — should fail with invalid password", async () => {
    const app = await buildApp(env);
    
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    vi.mocked(prisma.user.findUnique).mockResolvedValueOnce({
      id: "user-123",
      email: "test@example.com",
      password: hashedPassword,
    } as any);

    const response = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: {
        email: "test@example.com",
        password: "wrong-password",
      },
    });

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_CREDENTIALS");
  });
});
