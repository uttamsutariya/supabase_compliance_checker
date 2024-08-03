"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authSchema = void 0;
const zod_1 = require("zod");
exports.authSchema = zod_1.z.object({
    supabaseUrl: zod_1.z.string(),
    apiKey: zod_1.z.string(),
});
