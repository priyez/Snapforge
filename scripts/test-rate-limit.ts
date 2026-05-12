import axios from "axios";

/**
 * Test script to verify Phase 5: Rate Limiting
 * 
 * Usage:
 * 1. Start the API: pnpm dev
 * 2. Run this script: npx tsx scripts/test-rate-limit.ts
 */

const API_URL = "http://localhost:3000/api/screenshot";
const API_KEY = "sk_live_test_key"; // Replace with a valid key from your DB

async function testRateLimit() {
  console.log("🚀 Starting Rate Limit Test...");
  
  const requests = Array.from({ length: 15 }); // FREE plan limit is 10/min
  
  for (let i = 0; i < requests.length; i++) {
    try {
      console.log(`Sending request ${i + 1}...`);
      const response = await axios.get(API_URL, {
        params: { url: "https://example.com" },
        headers: { Authorization: `Bearer ${API_KEY}` }
      });
      
      console.log(`✅ Success: ${response.status} (Remaining: ${response.headers['x-ratelimit-remaining']})`);
    } catch (error: any) {
      if (error.response) {
        console.log(`❌ Failed: ${error.response.status} - ${error.response.data.error.message}`);
        if (error.response.status === 429) {
          console.log("🎯 Rate limit successfully triggered!");
        }
      } else {
        console.error("💥 Error:", error.message);
      }
    }
  }
}

testRateLimit();
