import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS || 12);

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export function createOpaqueToken() {
  return crypto.randomBytes(48).toString('hex');
}

export function buildCookie(name: string, value: string, options: {
  maxAge?: number;
  httpOnly?: boolean;
}) {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = isProd ? 'SameSite=None' : 'SameSite=Lax';
  
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    sameSite,
    ...(options.maxAge ? [`Max-Age=${options.maxAge}`] : []),
    ...(isProd ? ['Secure'] : []),
    ...(options.httpOnly === false ? [] : ['HttpOnly']),
  ];
  return parts.join('; ');
}

export function buildExpiredCookie(name: string) {
  const isProd = process.env.NODE_ENV === 'production';
  const sameSite = isProd ? 'SameSite=None' : 'SameSite=Lax';
  return `${name}=; Path=/; Max-Age=0; ${sameSite}${isProd ? '; Secure' : ''}; HttpOnly`;
}

export function extractCookie(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}
