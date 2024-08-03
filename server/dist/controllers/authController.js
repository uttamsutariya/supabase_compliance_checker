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
exports.logout = exports.getSecret = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const config_1 = __importDefault(require("../config"));
const User_1 = __importDefault(require("../models/User"));
const utils_1 = require("../utils/utils");
const client = new google_auth_library_1.OAuth2Client(config_1.default.GOOGLE_CLIENT_ID);
const authenticate = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { credential, client_id } = req.body;
    try {
        const ticket = yield client.verifyIdToken({
            idToken: credential,
            audience: client_id,
        });
        const payload = ticket.getPayload();
        if (payload) {
            const { sub, email, name, picture } = payload;
            let user = yield User_1.default.findOne({ googleId: sub });
            if (!user) {
                user = new User_1.default({
                    googleId: sub,
                    email,
                    name,
                    picture,
                });
                yield user.save();
            }
            const token = jsonwebtoken_1.default.sign({
                _id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture,
            }, config_1.default.JWT_SECRET);
            const session = yield (0, utils_1.createSession)(user);
            return res.status(200).json({
                token,
                session,
            });
        }
        else {
            return res.status(400).json({ message: 'Invalid payload' });
        }
    }
    catch (error) {
        console.log('error ::', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
});
exports.authenticate = authenticate;
const getSecret = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = res.locals;
    const session = yield (0, utils_1.getSession)(user._id);
    return res.status(200).json({ session });
});
exports.getSecret = getSecret;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { user } = res.locals;
    const session = yield (0, utils_1.invalidateSession)(user._id);
    return res.status(200).json({ session });
});
exports.logout = logout;
