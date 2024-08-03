"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    googleId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    picture: { type: String, required: true },
    supabasePAT: { type: String, required: false, default: '', select: false },
    supabaseConnected: { type: Boolean, required: false, default: false },
}, {
    versionKey: false,
    timestamps: true,
});
const User = (0, mongoose_1.model)('User', userSchema);
exports.default = User;
