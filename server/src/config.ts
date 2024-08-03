import { z } from 'zod';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import redis, { createClient } from 'redis';

dotenv.config();

const envSchema = z.object({
  GOOGLE_CLIENT_ID: z.string(),
  JWT_SECRET: z.string(),
  MONGODB_URI: z.string(),
  PORT: z.string().transform((val) => parseInt(val, 10)),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string(),
  REDIS_PASS: z.string(),
  SUPABASE_API_BASE_URL: z.string(),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error('Invalid environment variables:', env.error.format());
  process.exit(1);
}

const config = {
  GOOGLE_CLIENT_ID: env.data.GOOGLE_CLIENT_ID,
  JWT_SECRET: env.data.JWT_SECRET,
  PORT: env.data.PORT,
  MONGODB_URI: process.env.MONGODB_URI || '',
  REDIS_HOST: env.data.REDIS_HOST,
  REDIS_PORT: Number(env.data.REDIS_PORT),
  REDIS_PASS: env.data.REDIS_PASS,
  SUPABASE_API_BASE_URL: env.data.SUPABASE_API_BASE_URL,
};

export const dbConnect = async () => {
  await mongoose
    .connect(config.MONGODB_URI || '')
    .then(() => {
      console.log('Connected to MongoDB');
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error);
      process.exit(1);
    });
};

// redis config
const redisConfig = {
  host: config.REDIS_HOST || 'redis',
  port: config.REDIS_PORT || 6379,
  enable_offline_queue: false,
};

export const redisClient = createClient({
  socket: redisConfig,
  password: config.REDIS_PASS || '',
});

(async () => {
  redisClient.on('error', (err) => console.error('Redis Client Error', err));
  redisClient.on('connect', () => console.log('Connected to Redis!'));
  await redisClient.connect();
})();

export default config;
