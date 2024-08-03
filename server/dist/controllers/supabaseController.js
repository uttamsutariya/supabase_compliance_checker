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
exports.connectSupabase = connectSupabase;
const User_1 = __importDefault(require("../models/User"));
const axios_1 = __importDefault(require("axios"));
const utils_1 = require("../utils/utils");
function connectSupabase(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { personalAccessToken } = req.body;
        if (!personalAccessToken) {
            return res.status(400).json({ message: 'Supabase Access token is required!' });
        }
        const { user } = res.locals;
        try {
            const dbUser = yield User_1.default.findOne({ _id: user._id });
            if (!dbUser) {
                return res.status(400).json({ message: 'User not found!' });
            }
            if (dbUser.supabasePAT) {
                return res.status(400).json({ message: 'Already connected to Supabase!' });
            }
            // made this call just to check if access token is valid
            yield axios_1.default
                .get('https://api.supabase.com/v1/organizations', {
                headers: {
                    Authorization: `Bearer ${personalAccessToken}`,
                },
            })
                .then(() => __awaiter(this, void 0, void 0, function* () {
                dbUser.supabasePAT = personalAccessToken;
                dbUser.supabaseConnected = true;
                yield dbUser.save();
                yield (0, utils_1.invalidateSession)(dbUser._id);
                const session = yield (0, utils_1.createSession)(dbUser);
                return res.status(200).json({ message: 'Successfully connected to Supabase!', session: session });
            }))
                .catch((error) => {
                var _a;
                console.log('error ::', error);
                if (((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 401) {
                    return res.status(400).json({ message: 'Supabase Access token is invalid!' });
                }
                return res.status(500).json({ message: 'Internal Server Error' });
            });
        }
        catch (error) {
            console.log('error ::', error);
            return res.status(500).json({ message: 'Internal Server Error' });
        }
    });
}
