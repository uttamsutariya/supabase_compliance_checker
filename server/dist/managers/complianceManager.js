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
const axios_1 = __importDefault(require("axios"));
const config_1 = __importDefault(require("../config"));
const Compliance_1 = __importDefault(require("../models/Compliance"));
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const lodash_1 = __importDefault(require("lodash"));
class ComplianceManager {
    constructor(accessToken, userId) {
        this.accessToken = accessToken;
        this.userId = userId;
        this.organizations = [];
        this.logs = [];
    }
    getCompliance() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.fetchOrgs();
                yield this.fetchUsers();
                yield this.fetchDatabases();
                yield this.checkRLSStatus();
                yield this.checkPITRStatus();
                const compliance = yield Compliance_1.default.create({
                    user: this.userId,
                    organizations: this.organizations,
                });
                const [date, time] = new Date().toISOString().split('T');
                const logFileName = `${this.userId}-${date}-${time}.log`;
                yield this.writeLogsToFile(logFileName);
                return compliance;
            }
            catch (error) {
                console.log('error ::', error);
                throw error;
            }
        });
    }
    fetchOrgs() {
        return __awaiter(this, void 0, void 0, function* () {
            const orgs = yield this.supabaseHttpRequest('/organizations', 'GET', null);
            this.organizations = orgs;
        });
    }
    fetchUsers() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logs.push(`MFA STATUS :: \n`);
            for (const org of this.organizations) {
                this.logs.push(`Organization: ${org.name}`);
                const users = yield this.supabaseHttpRequest(`/organizations/${org.id}/members`, 'GET', null);
                org.users = lodash_1.default.map(users, (user) => {
                    this.logs.push(`User: ${user.user_name} with email: ${user.email} has mfa enabled: ${user.mfa_enabled}`);
                    return {
                        userId: user.user_id,
                        userName: user.user_name,
                        email: user.email,
                        roleName: user.role_name,
                        mfaEnabled: user.mfa_enabled,
                    };
                });
                this.logs.push(`\n`);
                org.mfaEnabledForAllUsers = lodash_1.default.reduce(users, (mfaEnabled, user) => mfaEnabled && user.mfa_enabled, true);
            }
            this.logs.push(`\n\n`);
        });
    }
    fetchDatabases() {
        return __awaiter(this, void 0, void 0, function* () {
            const databases = yield this.supabaseHttpRequest(`/projects`, 'GET', null);
            const orgWiseDatabases = lodash_1.default.groupBy(databases, 'organization_id');
            this.organizations = lodash_1.default.map(this.organizations, (org) => {
                // filtered active healthy dbs only as we can't fetch the rls and pitr status for inactive dbs
                const activeDbs = lodash_1.default.filter(orgWiseDatabases[org.id] || [], (db) => db.status === 'ACTIVE_HEALTHY');
                org.databases = lodash_1.default.map(activeDbs, (db) => {
                    var _a;
                    return ({
                        dbId: db === null || db === void 0 ? void 0 : db.id,
                        name: db === null || db === void 0 ? void 0 : db.name,
                        host: (_a = db === null || db === void 0 ? void 0 : db.database) === null || _a === void 0 ? void 0 : _a.host,
                        tables: [],
                    });
                });
                return org;
            });
        });
    }
    checkRLSStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            // using this query we can check if RLS is enabled for all the tables in the database
            const query = `
      SELECT 
        table_name, 
        relrowsecurity AS rls_enabled 
      FROM 
        information_schema.tables 
      JOIN 
        pg_class ON table_name = relname 
      WHERE 
        table_schema = 'public'
        AND table_type = 'BASE TABLE';
    `;
            this.logs.push(`RLS STATUS :: \n`);
            for (const org of this.organizations) {
                this.logs.push(`Organization: ${org.name}`);
                let rlsEnabledForAllDbs = true;
                for (const db of org.databases) {
                    const rlsStatus = yield this.supabaseHttpRequest(`/projects/${db.dbId}/database/query`, 'POST', {
                        query: query,
                    });
                    let rlsEnabled = true;
                    this.logs.push(`Database: ${db.name}, \n`);
                    db.tables = lodash_1.default.map(rlsStatus, (i) => {
                        if (i.rls_enabled === false)
                            rlsEnabled = false;
                        this.logs.push(`Table: ${i.table_name}, Enabled: ${i.rls_enabled}`);
                        return {
                            name: i.table_name,
                            rlsEnabled: i.rls_enabled,
                        };
                    });
                    db.rlsEnabledForAllTables = rlsEnabled;
                    this.logs.push(`Enabled for all tables: ${rlsEnabled}`);
                    rlsEnabledForAllDbs = rlsEnabledForAllDbs && rlsEnabled;
                }
                org.rlsEnabledForAllDbs = rlsEnabledForAllDbs;
                this.logs.push(`Enabled for all databases in organization: ${org.name}: ${rlsEnabledForAllDbs}`);
            }
            this.logs.push(`\n\n`);
        });
    }
    checkPITRStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            // inorder to check if PITR is enabled, we need to check the following queries
            // 1. archive_mode should be set to 'on'
            // 2. archive_command should be configured with the appropriate command for archiving WAL files. In the context of Supabase, this is managed by WAL-G., it should not equal to "(disabled)"
            // 3. wal_level should be set to 'replica' or 'logical'
            const queries = [
                { name: 'archive_mode', query: 'SHOW archive_mode;' },
                { name: 'archive_command', query: 'SHOW archive_command;' },
                { name: 'wal_level', query: 'SHOW wal_level;' },
            ];
            const expectedValues = {
                archive_mode: 'on',
                archive_command: '(disabled)', // should be set to the appropriate command for archiving WAL files
                wal_level: ['replica', 'logical'],
            };
            this.logs.push(`PITR STATUS :: \n`);
            for (const org of this.organizations) {
                let pitrEnabledForAllDbs = true;
                this.logs.push(`Organization: ${org.name}`);
                for (const db of org.databases) {
                    let res = yield Promise.all(queries.map((q) => this.supabaseHttpRequest(`/projects/${db.dbId}/database/query`, 'POST', { query: q.query })));
                    const receivedValues = lodash_1.default.reduce(lodash_1.default.flatten(res), (acc, r) => {
                        return Object.assign(Object.assign({}, acc), r);
                    }, {});
                    let pitrEnabled = true;
                    for (const key in expectedValues) {
                        const rVal = lodash_1.default.get(receivedValues, key, null);
                        if (key === 'archive_command' && rVal === '(disabled)') {
                            pitrEnabled = false;
                            break;
                        }
                        else if (key === 'wal_level' && rVal !== 'replica' && rVal !== 'logical') {
                            pitrEnabled = false;
                            break;
                        }
                        else if (key === 'archive_mode' && rVal !== 'on') {
                            pitrEnabled = false;
                            break;
                        }
                    }
                    db.pitrEnabled = pitrEnabled;
                    this.logs.push(`Table: ${db.name}, Enabled: ${pitrEnabled}`);
                    pitrEnabledForAllDbs = pitrEnabledForAllDbs && pitrEnabled;
                }
                org.pitrEnabledForAllDbs = pitrEnabledForAllDbs;
                this.logs.push(`Enabled for all databases in organization: ${org.name}: ${pitrEnabledForAllDbs}`);
            }
            this.logs.push(`\n\n`);
        });
    }
    writeLogsToFile(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const logs = this.logs.join('\n');
            const pathToLogs = path_1.default.resolve(__dirname, '../../logs');
            console.log('pathToLogs', pathToLogs);
            yield promises_1.default.mkdir(pathToLogs, { recursive: true });
            yield promises_1.default.writeFile(`${pathToLogs}/${fileName}`, logs);
        });
    }
    supabaseHttpRequest(endpoint, method, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const axiosConfig = {
                    url: config_1.default.SUPABASE_API_BASE_URL + endpoint,
                    method: method,
                    headers: {
                        Authorization: `Bearer ${this.accessToken}`,
                    },
                    data: payload,
                };
                const res = yield (0, axios_1.default)(axiosConfig);
                return res.data;
            }
            catch (error) {
                console.error('HTTP Request Error:', error);
                throw error;
            }
        });
    }
}
exports.default = ComplianceManager;
