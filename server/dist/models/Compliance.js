"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tableSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    rlsEnabled: { type: Boolean, required: true, default: false },
});
const databaseSchema = new mongoose_1.Schema({
    dbId: { type: String, required: true },
    name: { type: String, required: true },
    host: { type: String, required: true },
    rlsEnabledForAllTables: { type: Boolean, required: true, default: false },
    pitrEnabled: { type: Boolean, required: true, default: false },
    tables: [tableSchema],
});
const orgUserSchema = new mongoose_1.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    email: { type: String, required: true },
    roleName: { type: String, required: true },
    mfaEnabled: { type: Boolean, required: true, default: false },
});
const organizationSchema = new mongoose_1.Schema({
    users: {
        type: [orgUserSchema],
        required: true,
        default: [],
    },
    name: { type: String, required: true },
    databases: {
        type: [databaseSchema],
        required: true,
        default: [],
    },
    mfaEnabledForAllUsers: {
        type: Boolean,
        required: true,
        default: false,
    },
    rlsEnabledForAllDbs: {
        type: Boolean,
        required: true,
        default: false,
    },
    pitrEnabledForAllDbs: {
        type: Boolean,
        required: true,
        default: false,
    },
});
const complianceSchema = new mongoose_1.Schema({
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    organizations: [organizationSchema],
}, {
    versionKey: false,
    timestamps: true,
});
// organizationSchema.methods.toJSON = function () {
//   const organizationObj = this.toObject();
//   return {
//     _id: organizationObj._id,
//     name: organizationObj.name,
//     mfaEnabledForAllUsers: organizationObj.mfaEnabledForAllUsers,
//     rlsEnabledForAllDbs: organizationObj.rlsEnabledForAllDbs,
//     pitrEnabledForAllDbs: organizationObj.pitrEnabledForAllDbs,
//   };
// };
const Compliance = (0, mongoose_1.model)('Compliance', complianceSchema);
exports.default = Compliance;
