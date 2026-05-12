import { resolve } from "node:dns/promises";
import { isIP } from "node:net";
import { URL } from "node:url";

/**
 * Blocked hostnames that should never be accessed by the screenshot service.
 */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
  "metadata.google.internal",
  "metadata.internal",
  "instance-data",
]);

/**
 * Check if an IP address falls within private/reserved ranges.
 * Prevents SSRF attacks targeting internal infrastructure.
 */
function isPrivateIp(ip: string): boolean {
  const parts = ip.split(".").map(Number);

  if (parts.length !== 4) return false;

  // 127.0.0.0/8 — Loopback
  if (parts[0] === 127) return true;

  // 10.0.0.0/8 — Private
  if (parts[0] === 10) return true;

  // 172.16.0.0/12 — Private
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16 — Private
  if (parts[0] === 192 && parts[1] === 168) return true;

  // 169.254.0.0/16 — Link-local (includes AWS metadata 169.254.169.254)
  if (parts[0] === 169 && parts[1] === 254) return true;

  // 0.0.0.0/8 — Current network
  if (parts[0] === 0) return true;

  return false;
}

export interface UrlValidationResult {
  valid: boolean;
  reason?: string;
  resolvedIp?: string;
}

/**
 * Validate a URL for safety before passing it to the headless browser.
 *
 * Checks:
 * 1. Valid URL format
 * 2. Only http/https protocols allowed
 * 3. Hostname not in blocklist
 * 4. Resolved IP not in private ranges (prevents DNS rebinding)
 */
export async function validateUrl(input: string): Promise<UrlValidationResult> {
  // 1. Parse URL
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  // 2. Protocol whitelist
  if (!["http:", "https:"].includes(parsed.protocol)) {
    return {
      valid: false,
      reason: `Protocol "${parsed.protocol}" not allowed. Only http and https are permitted.`,
    };
  }

  // 3. Hostname blocklist
  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: `Hostname "${hostname}" is blocked` };
  }

  // 4. Check if hostname is a raw IP
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { valid: false, reason: "Private/internal IP addresses are not allowed" };
    }
    return { valid: true, resolvedIp: hostname };
  }

  // 5. DNS resolution check — prevent DNS rebinding
  try {
    const addresses = await resolve(hostname);
    if (addresses.length === 0) {
      return { valid: false, reason: "DNS resolution returned no addresses" };
    }

    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return {
          valid: false,
          reason: `Domain resolves to private IP (${addr}). This is not allowed.`,
        };
      }
    }

    return { valid: true, resolvedIp: addresses[0] };
  } catch {
    return { valid: false, reason: "DNS resolution failed for hostname" };
  }
}

/**
 * Quick synchronous URL format check (no DNS resolution).
 * Use for fast request validation before enqueuing.
 */
export function validateUrlFormat(input: string): UrlValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    return { valid: false, reason: "Invalid URL format" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { valid: false, reason: `Protocol "${parsed.protocol}" not allowed` };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return { valid: false, reason: `Hostname "${hostname}" is blocked` };
  }

  if (isIP(hostname) && isPrivateIp(hostname)) {
    return { valid: false, reason: "Private/internal IP addresses are not allowed" };
  }

  return { valid: true };
}
