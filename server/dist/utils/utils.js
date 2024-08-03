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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSession = createSession;
exports.getSession = getSession;
exports.invalidateSession = invalidateSession;
const config_1 = require("../config");
const constants_1 = require("../constants");
function createSession(user) {
    return __awaiter(this, void 0, void 0, function* () {
        const sessionId = user._id;
        const session = {
            userId: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            supabaseConnected: user.supabaseConnected,
        };
        yield config_1.redisClient.set(`${constants_1.AUTH_SESSION_REDIS_KEY}:${sessionId}`, JSON.stringify(session));
        return session;
    });
}
function getSession(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield config_1.redisClient.get(`${constants_1.AUTH_SESSION_REDIS_KEY}:${userId}`);
        if (!session) {
            return null;
        }
        return JSON.parse(session);
    });
}
function invalidateSession(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        const session = JSON.parse((yield config_1.redisClient.get(`${constants_1.AUTH_SESSION_REDIS_KEY}:${userId}`)) || '{}');
        if (!session) {
            return null;
        }
        yield config_1.redisClient.del(`${constants_1.AUTH_SESSION_REDIS_KEY}:${userId}`);
        return session;
    });
}
