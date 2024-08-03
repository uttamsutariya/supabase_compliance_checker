"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.dbConnect = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const redis_1 = require("redis");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    GOOGLE_CLIENT_ID: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string(),
    MONGODB_URI: zod_1.z.string(),
    PORT: zod_1.z.string().transform((val) => parseInt(val, 10)),
    REDIS_HOST: zod_1.z.string(),
    REDIS_PORT: zod_1.z.string(),
    REDIS_PASS: zod_1.z.string(),
    SUPABASE_API_BASE_URL: zod_1.z.string(),
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
const dbConnect = () => __awaiter(void 0, void 0, void 0, function* () {
    yield mongoose_1.default
        .connect(config.MONGODB_URI || '')
        .then(() => {
        console.log('Connected to MongoDB');
    })
        .catch((error) => {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    });
});
exports.dbConnect = dbConnect;
// redis config
const redisConfig = {
    host: config.REDIS_HOST || 'redis',
    port: config.REDIS_PORT || 6379,
    enable_offline_queue: false,
};
exports.redisClient = (0, redis_1.createClient)({
    socket: redisConfig,
    password: config.REDIS_PASS || '',
});
(() => __awaiter(void 0, void 0, void 0, function* () {
    exports.redisClient.on('error', (err) => console.error('Redis Client Error', err));
    exports.redisClient.on('connect', () => console.log('Connected to Redis!'));
    yield exports.redisClient.connect();
}))();
exports.default = config;
