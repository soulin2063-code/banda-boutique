/**
 * In-memory Rate Limiting
 *
 * القرار الأمني: Rate limiting يمنع Brute Force attacks على login الأدمن
 * وSpam attacks على طلبات الزبائن.
 *
 * ملاحظة: هذا التطبيق in-memory مناسب لبيئة Single Process.
 * في production مع عدة instances، استخدم Redis (Upstash أو Vercel KV).
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory buckets
const ipBuckets = new Map<string, RateLimitRecord>();
const phoneBuckets = new Map<string, RateLimitRecord>();
const loginBuckets = new Map<string, RateLimitRecord>(); // للـ admin login

function checkBucket(
  map: Map<string, RateLimitRecord>,
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const record = map.get(key);

  if (!record || record.resetAt <= now) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetInSec: Math.ceil(windowMs / 1000) };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInSec: Math.ceil((record.resetAt - now) / 1000),
  };
}

// Cleanup expired keys لمنع memory leak
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipBuckets.entries()) {
    if (v.resetAt <= now) ipBuckets.delete(k);
  }
  for (const [k, v] of phoneBuckets.entries()) {
    if (v.resetAt <= now) phoneBuckets.delete(k);
  }
  for (const [k, v] of loginBuckets.entries()) {
    if (v.resetAt <= now) loginBuckets.delete(k);
  }
}, 60_000);

/**
 * Rate limiting لطلبات الزبائن (POST /api/orders)
 * الحد: 20 طلب/IP/ساعة + 5 طلبات/رقم هاتف/ساعة
 */
export function checkOrderRateLimit(
  ip: string,
  phone: string
): { allowed: boolean; reason?: string } {
  const oneHourMs = 60 * 60 * 1000;

  // Max 20 orders per IP per hour
  const ipCheck = checkBucket(ipBuckets, `order:${ip}`, 20, oneHourMs);
  if (!ipCheck.allowed) {
    return {
      allowed: false,
      reason: `Trop de tentatives depuis cette adresse IP. Réessayez dans ${ipCheck.resetInSec} secondes.`,
    };
  }

  // Max 5 orders per phone per hour
  const normalizedPhone = phone.replace(/\D/g, '').slice(-9);
  const phoneCheck = checkBucket(phoneBuckets, `order:${normalizedPhone}`, 5, oneHourMs);
  if (!phoneCheck.allowed) {
    return {
      allowed: false,
      reason: `Trop de commandes avec ce numéro. Réessayez plus tard.`,
    };
  }

  return { allowed: true };
}

/**
 * Rate limiting لمحاولات تسجيل دخول الأدمن
 * القرار الأمني: 5 محاولات فاشلة فقط كل 15 دقيقة per IP
 * هذا يجعل Brute Force attack مستحيلاً عملياً مع كلمات مرور قوية
 *
 * @param ip - عنوان IP للطلب
 * @param email - إيميل الأدمن (للتتبع المنفصل per-user)
 */
export function checkLoginRateLimit(
  ip: string,
  email: string
): { allowed: boolean; resetInSec?: number } {
  const fifteenMinMs = 15 * 60 * 1000;

  // 5 محاولات per IP per 15 دقيقة
  const ipCheck = checkBucket(loginBuckets, `login:ip:${ip}`, 5, fifteenMinMs);
  if (!ipCheck.allowed) {
    return { allowed: false, resetInSec: ipCheck.resetInSec };
  }

  // 10 محاولات per email per 15 دقيقة (أكثر سخاءً لأن الـ IP قد يتغير)
  const emailKey = email.toLowerCase().trim();
  const emailCheck = checkBucket(loginBuckets, `login:email:${emailKey}`, 10, fifteenMinMs);
  if (!emailCheck.allowed) {
    return { allowed: false, resetInSec: emailCheck.resetInSec };
  }

  return { allowed: true };
}
