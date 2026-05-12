import { vi } from "vitest";
import RedisMock from "ioredis-mock";

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

// Mock Redis
vi.mock("ioredis", () => {
  return {
    default: RedisMock,
    Redis: RedisMock,
  };
});

// Mock BullMQ
vi.mock("bullmq", () => {
  const mockJob = {
    id: "test-job",
    waitUntilFinished: vi.fn().mockResolvedValue({ imageUrl: "https://example.com/test.png" }),
    getState: vi.fn().mockResolvedValue("completed"),
    returnvalue: { imageUrl: "https://example.com/test.png" },
  };

  return {
    Queue: vi.fn().mockImplementation(() => ({
      add: vi.fn().mockResolvedValue(mockJob),
      close: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      getJob: vi.fn().mockResolvedValue(mockJob),
      waitUntilFinished: vi.fn().mockResolvedValue({ imageUrl: "https://example.com/test.png" }),
    })),
    Worker: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    })),
    QueueEvents: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined),
    })),
  };
});

// Clean up environment variables
process.env.JWT_SECRET = "test-secret";
process.env.NODE_ENV = "test";
