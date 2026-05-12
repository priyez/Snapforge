import { ScreenshotAPI } from "../packages/sdk/src/index.js";

// ── Configuration ───────────────────────────────────────────────

const API_KEY = process.env.API_KEY || "sk_live_test_key";
const API_URL = "http://localhost:3000";

const sdk = new ScreenshotAPI({
  apiKey: API_KEY,
  baseUrl: API_URL,
});

async function runDemo() {
  console.log("🚀 Starting SDK Demo...");

  try {
    // 1. Synchronous Screenshot
    console.log("\n📸 [1/3] Taking sync screenshot...");
    const result = await sdk.screenshot({
      url: "https://google.com",
      width: 1280,
      height: 720,
      format: "png",
    });
    console.log("✅ Sync Success!");
    console.log(`🔗 Image URL: ${result.imageUrl}`);
    console.log(`⏱️ Render Time: ${result.renderTimeMs}ms`);

    // 2. Asynchronous Screenshot
    console.log("\n⏳ [2/3] Taking async screenshot...");
    const job = await sdk.screenshotAsync({
      url: "https://github.com",
      fullPage: true,
    });
    console.log(`✅ Job Enqueued: ${job.jobId}`);

    // 3. Waiting for Async Job
    console.log("🔄 [3/3] Waiting for job completion...");
    const completed = await sdk.waitForJob(job.jobId);
    if (completed.status === "completed") {
      console.log("✅ Async Success!");
      console.log(`🔗 Image URL: ${completed.imageUrl}`);
    } else {
      console.log(`❌ Job Failed: ${completed.error}`);
    }

  } catch (err: any) {
    console.error("\n❌ SDK Error:");
    console.error(`Code: ${err.code}`);
    console.error(`Message: ${err.message}`);
  }
}

runDemo();
