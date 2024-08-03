import axios, { AxiosRequestConfig, Method } from 'axios';
import config from '../config';
import Compliance from '../models/Compliance';
import fs from 'fs/promises';
import path from 'path';
import _ from 'lodash';

class ComplianceManager {
  accessToken: string;
  userId: string;
  organizations: any[];
  logs: any[];

  constructor(accessToken: string, userId: string) {
    this.accessToken = accessToken;
    this.userId = userId;
    this.organizations = [];
    this.logs = [];
  }

  async getCompliance() {
    try {
      await this.fetchOrgs();
      await this.fetchUsers();
      await this.fetchDatabases();
      await this.checkRLSStatus();
      await this.checkPITRStatus();

      const compliance = await Compliance.create({
        user: this.userId,
        organizations: this.organizations,
      });

      const [date, time] = new Date().toISOString().split('T');
      const logFileName = `${this.userId}-${date}-${time}.log`;
      await this.writeLogsToFile(logFileName);

      return compliance;
    } catch (error) {
      console.log('error ::', error);
      throw error;
    }
  }

  private async fetchOrgs() {
    const orgs = await this.supabaseHttpRequest('/organizations', 'GET', null);
    this.organizations = orgs;
  }

  private async fetchUsers() {
    this.logs.push(`MFA STATUS :: \n`);
    for (const org of this.organizations) {
      this.logs.push(`Organization: ${org.name}`);
      const users = await this.supabaseHttpRequest(`/organizations/${org.id}/members`, 'GET', null);
      org.users = _.map(users, (user) => {
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
      org.mfaEnabledForAllUsers = _.reduce(users, (mfaEnabled, user) => mfaEnabled && user.mfa_enabled, true);
    }
    this.logs.push(`\n\n`);
  }

  private async fetchDatabases() {
    const databases = await this.supabaseHttpRequest(`/projects`, 'GET', null);
    const orgWiseDatabases = _.groupBy(databases, 'organization_id');
    this.organizations = _.map(this.organizations, (org) => {
      // filtered active healthy dbs only as we can't fetch the rls and pitr status for inactive dbs
      const activeDbs = _.filter(orgWiseDatabases[org.id] || [], (db) => db.status === 'ACTIVE_HEALTHY');
      org.databases = _.map(activeDbs, (db) => ({
        dbId: db?.id,
        name: db?.name,
        host: db?.database?.host,
        tables: [],
      }));
      return org;
    });
  }

  private async checkRLSStatus() {
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
        const rlsStatus = await this.supabaseHttpRequest(`/projects/${db.dbId}/database/query`, 'POST', {
          query: query,
        });
        let rlsEnabled = true;
        this.logs.push(`Database: ${db.name}, \n`);
        db.tables = _.map(rlsStatus, (i) => {
          if (i.rls_enabled === false) rlsEnabled = false;
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
  }

  private async checkPITRStatus() {
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
        let res = await Promise.all(
          queries.map((q) =>
            this.supabaseHttpRequest(`/projects/${db.dbId}/database/query`, 'POST', { query: q.query })
          )
        );
        const receivedValues = _.reduce(
          _.flatten(res),
          (acc, r) => {
            return {
              ...acc,
              ...r,
            };
          },
          {}
        );

        let pitrEnabled = true;
        for (const key in expectedValues) {
          const rVal = _.get(receivedValues, key, null);

          if (key === 'archive_command' && rVal === '(disabled)') {
            pitrEnabled = false;
            break;
          } else if (key === 'wal_level' && rVal !== 'replica' && rVal !== 'logical') {
            pitrEnabled = false;
            break;
          } else if (key === 'archive_mode' && rVal !== 'on') {
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
  }

  private async writeLogsToFile(fileName: string) {
    const logs = this.logs.join('\n');
    const pathToLogs = path.resolve(__dirname, '../../logs');
    console.log('pathToLogs', pathToLogs);

    await fs.mkdir(pathToLogs, { recursive: true });
    await fs.writeFile(`${pathToLogs}/${fileName}`, logs);
  }

  private async supabaseHttpRequest(endpoint: string, method: Method, payload: any) {
    try {
      const axiosConfig: AxiosRequestConfig = {
        url: config.SUPABASE_API_BASE_URL + endpoint,
        method: method,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
        data: payload,
      };

      const res = await axios(axiosConfig);
      return res.data;
    } catch (error) {
      console.error('HTTP Request Error:', error);
      throw error;
    }
  }
}

export default ComplianceManager;
