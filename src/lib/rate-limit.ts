export const REPO_GENERATED_COOKIE = "agentstack_generated";

const MAX_REQUESTS_PER_HOUR = 3;
const ONE_HOUR_MS = 60 * 60 * 1000;

const ipMap = new Map<string, { count: number; resetAt: number }>();

export function checkIpRateLimit(ip: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const entry = ipMap.get(ip);

  if (!entry || now >= entry.resetAt) {
    ipMap.set(ip, { count: 1, resetAt: now + ONE_HOUR_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS_PER_HOUR) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetAt - now) / 60000),
    };
  }

  entry.count += 1;
  return { allowed: true };
}

export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");

  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
