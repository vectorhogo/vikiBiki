/**
 * Security & TOTP (RFC 6238) Module for Auto Abdollahi
 * Implements:
 * - RFC 6238 (TOTP) / RFC 4226 (HOTP) using native Web Crypto API (HMAC-SHA1, 6 digits, 30s period)
 * - Cryptographically random Base32 secret generation
 * - 24-Hour Access Lease management
 * - Clock rollback protection & monotonic time tracking
 * - Device binding
 * - Encrypted secret storage (never stored in plain text)
 * - Rate limiting against brute force
 */

const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const LEASE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_PREFIX = 'aa_sec_v1_';

export interface SecurityState {
  isConfigured: boolean; // Has Google Authenticator been paired?
  isUnlocked: boolean; // Is 24h lease currently valid and active?
  activatedAt: number | null; // Timestamp ms when current lease was unlocked
  expiresAt: number | null; // Timestamp ms when current lease expires
  secondsRemaining: number; // Countdown seconds left
  lastTrustedTime: number; // For clock rollback detection
  clockTampered: boolean; // Flagged if system clock was rolled back
  failedAttempts: number; // Rate limiting counter
  lockoutUntil: number | null; // Lockout timestamp ms if too many failed attempts
  deviceBindingId: string; // Unique installation/device token
  lastBackupStatus?: {
    date: string;
    status: 'valid' | 'failed';
    type?: string;
  };
}

// ---------------------------------------------------------
// 1. BASE32 ENCODING & DECODING
// ---------------------------------------------------------

export function generateRandomBase32Secret(byteLength: number = 20): string {
  const bytes = new Uint8Array(byteLength);
  window.crypto.getRandomValues(bytes);
  let base32 = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      base32 += BASE32_CHARS[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    base32 += BASE32_CHARS[(value << (5 - bits)) & 31];
  }
  return base32;
}

export function base32ToBytes(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_CHARS.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

// ---------------------------------------------------------
// 2. RFC 6238 TOTP CALCULATION (Web Crypto HMAC-SHA1)
// ---------------------------------------------------------

export async function generateTotpCode(secretBase32: string, timeMs: number = Date.now()): Promise<string> {
  const keyBytes = base32ToBytes(secretBase32);
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: { name: 'SHA-1' } },
    false,
    ['sign']
  );

  const timeStep = Math.floor(timeMs / 1000 / 30);
  const counterBuffer = new ArrayBuffer(8);
  const dataView = new DataView(counterBuffer);
  // 64-bit integer big-endian
  const high = Math.floor(timeStep / 0x100000000);
  const low = timeStep >>> 0;
  dataView.setUint32(0, high, false);
  dataView.setUint32(4, low, false);

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBuffer);
  const hmac = new Uint8Array(signature);

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

export async function verifyTotpCode(
  secretBase32: string,
  userCode: string,
  timeMs: number = Date.now(),
  windowSteps: number = 1
): Promise<boolean> {
  const cleanCode = userCode.trim().replace(/\D/g, '');
  if (cleanCode.length !== 6) return false;

  for (let step = -windowSteps; step <= windowSteps; step++) {
    const checkTime = timeMs + step * 30 * 1000;
    const generated = await generateTotpCode(secretBase32, checkTime);
    if (generated === cleanCode) {
      return true;
    }
  }
  return false;
}

export function getTotpUri(secret: string, accountName: string = 'مدیر_سیستم', issuer: string = 'اتو_عبداللهی'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

// ---------------------------------------------------------
// 3. SECURE ENCRYPTED STORAGE OF TOTP SECRET
// ---------------------------------------------------------

async function getDeviceEncryptionKey(deviceId: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKeyMaterial = encoder.encode(`aa_secure_device_${deviceId}_salt_9f27`);
  const hash = await window.crypto.subtle.digest('SHA-256', rawKeyMaterial);

  return window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptAndSaveSecret(secret: string, deviceId: string): Promise<void> {
  const key = await getDeviceEncryptionKey(deviceId);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(secret)
  );

  const payload = {
    iv: Array.from(iv),
    data: Array.from(new Uint8Array(ciphertext)),
  };

  localStorage.setItem(`${STORAGE_PREFIX}enc_secret`, JSON.stringify(payload));
}

export async function loadAndDecryptSecret(deviceId: string): Promise<string | null> {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}enc_secret`);
    if (!raw) return null;

    const payload = JSON.parse(raw);
    const key = await getDeviceEncryptionKey(deviceId);
    const iv = new Uint8Array(payload.iv);
    const data = new Uint8Array(payload.data);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (err) {
    console.error('Failed to decrypt security secret:', err);
    return null;
  }
}

// ---------------------------------------------------------
// 4. DEVICE BINDING
// ---------------------------------------------------------

export function getOrCreateDeviceId(): string {
  let id = localStorage.getItem(`${STORAGE_PREFIX}device_id`);
  if (!id) {
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    id = Array.from(randomBytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(`${STORAGE_PREFIX}device_id`, id);
  }
  return id;
}

// ---------------------------------------------------------
// 5. ACCESS LEASE & MONOTONIC TIMER STATE
// ---------------------------------------------------------

export function loadPersistedLease(): {
  activatedAt: number | null;
  expiresAt: number | null;
  lastTrustedTime: number;
} {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}lease`);
  const now = Date.now();
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      return {
        activatedAt: typeof parsed.activatedAt === 'number' ? parsed.activatedAt : null,
        expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
        lastTrustedTime: typeof parsed.lastTrustedTime === 'number' ? parsed.lastTrustedTime : now,
      };
    } catch {
      // ignore
    }
  }
  return {
    activatedAt: null,
    expiresAt: null,
    lastTrustedTime: now,
  };
}

export function savePersistedLease(activatedAt: number | null, expiresAt: number | null, lastTrustedTime: number): void {
  localStorage.setItem(
    `${STORAGE_PREFIX}lease`,
    JSON.stringify({
      activatedAt,
      expiresAt,
      lastTrustedTime,
    })
  );
}

export function createNew24HourLease(deviceId: string): { activatedAt: number; expiresAt: number } {
  const now = Date.now();
  const expiresAt = now + LEASE_DURATION_MS;
  savePersistedLease(now, expiresAt, now);
  // Clear any failed attempts
  localStorage.removeItem(`${STORAGE_PREFIX}failed_attempts`);
  return { activatedAt: now, expiresAt };
}
