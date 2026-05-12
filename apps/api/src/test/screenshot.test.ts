import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildApp } from "../app.js";

// Mock Prisma
vi.mock("@screenshot-api/db", () => {
  return {
    prisma: {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
      apiKey: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn().mockReturnValue({ catch: vi.fn() }),
        findMany: vi.fn(),
      },
      screenshotJob: {
        create: vi.fn(),
        findMany: vi.fn(),
      },
    },
  };
});

import { prisma } from "@screenshot-api/db";

describe("Screenshot API", () => {
  const env = {
    PORT: 3000,
    NODE_ENV: "test" as const,
    DATABASE_URL: "postgresql://test",
    REDIS_URL: "redis://localhost",
    STORAGE_PROVIDER: "local" as const,
    STORAGE_PATH: "./test-storage",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock for API key
    vi.mocked(prisma.apiKey.findUnique).mockResolvedValue({
      id: "key-123",
      userId: "user-123",
      user: { id: "user-123", plan: "PRO" },
    } as any);
  });

  it("POST /api/screenshot — should fail with invalid URL", async () => {
    const app = await buildApp(env);
    
    const response = await app.inject({
      method: "POST",
      url: "/api/screenshot",
      headers: { Authorization: "Bearer sfg_live_test" },
      payload: { url: "not-a-url" },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("POST /api/screenshot — should fail with blocked URL (SSRF)", async () => {
    const app = await buildApp(env);
    
    const response = await app.inject({
      method: "POST",
      url: "/api/screenshot",
      headers: { Authorization: "Bearer sfg_live_test" },
      payload: { url: "http://169.254.169.254/latest/meta-data/" },
    });

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INVALID_URL");
  });

  it("POST /api/screenshot — should enqueue job successfully", async () => {
    const app = await buildApp(env);
    
    const response = await app.inject({
      method: "POST",
      url: "/api/screenshot",
      headers: { Authorization: "Bearer sfg_live_test" },
      payload: {
        url: "https://example.com",
        format: "webp",
        width: 800,
      },
    });

    if (response.statusCode !== 200) {
      console.error("Payload:", response.payload);
    }

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.payload);
    expect(body.success).toBe(true);
    expect(body.data.imageUrl).toBeDefined();
  });
});
