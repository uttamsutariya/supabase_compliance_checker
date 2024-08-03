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
exports.syncCompliance = syncCompliance;
exports.getCompliance = getCompliance;
const complianceManager_1 = __importDefault(require("../managers/complianceManager"));
const utils_1 = require("../utils/utils");
const User_1 = __importDefault(require("../models/User"));
const config_1 = require("../config");
const constants_1 = require("../constants");
const Compliance_1 = __importDefault(require("../models/Compliance"));
function syncCompliance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = res.locals.user._id;
            const latestCompliance = yield Compliance_1.default.findOne({ user: userId }).sort({ createdAt: -1 }).limit(1);
            if (latestCompliance) {
                // @ts-ignore
                const latestComplianceTimestamp = +new Date(latestCompliance === null || latestCompliance === void 0 ? void 0 : latestCompliance.createdAt);
                const currentComplianceTimestamp = +new Date();
                const diffInMinutes = Math.round((currentComplianceTimestamp - latestComplianceTimestamp) / (1000 * 60));
                if (diffInMinutes < 1) {
                    return res.status(200).json(latestCompliance);
                }
            }
            const dbUser = yield User_1.default.findOne({ _id: userId }, { supabasePAT: 1 });
            if (!dbUser) {
                return res.status(400).json({ message: 'User not found!' });
            }
            const accessToken = dbUser.supabasePAT;
            if (!accessToken) {
                return res.status(400).json({ message: 'Access token is required!, please connect to Supabase first!' });
            }
            const complianceManager = new complianceManager_1.default(accessToken, userId);
            const compliance = yield complianceManager.getCompliance();
            yield config_1.redisClient.set(`${constants_1.LATEST_COMPLIANCE_REDIS_KEY}:${userId}`, JSON.stringify(compliance));
            return res.status(200).json(compliance);
        }
        catch (error) {
            console.error('Error fetching compliance data:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
}
function getCompliance(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { supabaseConnected } = yield (0, utils_1.getSession)(res.locals.user._id);
            if (!supabaseConnected) {
                return res.status(400).json({ message: 'Please connect to Supabase first!' });
            }
            const userId = res.locals.user._id;
            // fetch latest compliance data from redis
            const latestCompliance = yield config_1.redisClient.get(`${constants_1.LATEST_COMPLIANCE_REDIS_KEY}:${userId}`);
            if (!latestCompliance) {
                // not found from redis, means no compliance data exists for the user
                // fetch it from complaince manager and save it to redis
                const dbUser = yield User_1.default.findOne({ _id: userId }, {
                    supabasePAT: 1,
                });
                if (!dbUser) {
                    return res.status(400).json({ message: 'User not found!' });
                }
                const accessToken = dbUser.supabasePAT;
                if (!accessToken) {
                    return res.status(400).json({ message: 'Access token is required!, please connect to Supabase first!' });
                }
                const complianceManager = new complianceManager_1.default(accessToken, userId);
                const compliance = yield complianceManager.getCompliance();
                yield config_1.redisClient.set(`${constants_1.LATEST_COMPLIANCE_REDIS_KEY}:${userId}`, JSON.stringify(compliance));
                return res.status(200).json(compliance);
            }
            return res.status(200).json(JSON.parse(latestCompliance));
        }
        catch (error) {
            console.error('Error fetching compliance data:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
}
