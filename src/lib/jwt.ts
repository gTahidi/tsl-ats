import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { AuthUser } from '@/types';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret-for-dev');

export async function createJWT(user: AuthUser): Promise<string> {
  return new SignJWT({
    ...user,
    sub: user.id  // Set the subject claim to user ID
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch {
    return null;
  }
}
