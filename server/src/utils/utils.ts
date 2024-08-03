import { redisClient } from '../config';
import { AUTH_SESSION_REDIS_KEY } from '../constants';
import { IUser } from '../types';

export async function createSession(user: IUser) {
  const sessionId = user._id;
  const session = {
    userId: user._id,
    email: user.email,
    name: user.name,
    picture: user.picture,
    supabaseConnected: user.supabaseConnected,
  };
  await redisClient.set(`${AUTH_SESSION_REDIS_KEY}:${sessionId}`, JSON.stringify(session));
  return session;
}

export async function getSession(userId: string) {
  const session = await redisClient.get(`${AUTH_SESSION_REDIS_KEY}:${userId}`);
  if (!session) {
    return null;
  }
  return JSON.parse(session);
}

export async function invalidateSession(userId: string) {
  const session = JSON.parse((await redisClient.get(`${AUTH_SESSION_REDIS_KEY}:${userId}`)) || '{}');
  if (!session) {
    return null;
  }
  await redisClient.del(`${AUTH_SESSION_REDIS_KEY}:${userId}`);
  return session;
}
