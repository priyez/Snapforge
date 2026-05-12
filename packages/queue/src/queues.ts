import { Queue, QueueEvents, type ConnectionOptions } from "bullmq";
import { QUEUE_NAMES } from "@screenshot-api/shared";

/**
 * Create the screenshot processing queue.
 */
export function createScreenshotQueue(connection: ConnectionOptions): Queue {
  return new Queue(QUEUE_NAMES.SCREENSHOT, {
    connection,
    defaultJobOptions: {
      removeOnComplete: {
        age: 3600, // Keep completed jobs for 1 hour
        count: 1000, // Keep last 1000 completed jobs
      },
      removeOnFail: {
        age: 86400, // Keep failed jobs for 24 hours
      },
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 2000,
      },
    },
  });
}

/**
 * Create queue events listener for waiting on job completion.
 */
export function createQueueEvents(connection: ConnectionOptions): QueueEvents {
  return new QueueEvents(QUEUE_NAMES.SCREENSHOT, { connection });
}
