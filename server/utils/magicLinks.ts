import jwt from 'jsonwebtoken';

export interface MagicLinkPayload {
  userId: number;
  eventId: number;
  type: 'acknowledgement';
}

export function generateMagicLinkToken(payload: MagicLinkPayload): string {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  return jwt.sign(payload, process.env.JWT_SECRET, { 
    expiresIn: '7d' // Magic links expire in 7 days
  });
}

export function buildMagicLink(userId: number, eventId: number): string {
  const token = generateMagicLinkToken({ userId, eventId, type: 'acknowledgement' });
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  return `${baseUrl}/acknowledge?token=${token}`;
}

export function verifyMagicLinkToken(token: string): MagicLinkPayload | null {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as MagicLinkPayload;
    return payload;
  } catch (error) {
    return null;
  }
}