export interface IOrganization {
  _id: string;
  name: string;
  users: IOrgUser[];
  databases: IDatabase[];
  mfaEnabledForAllUsers: boolean;
  rlsEnabledForAllDbs: boolean;
  pitrEnabledForAllDbs: boolean;
}

export interface IOrgUser {
  _id: string;
  userId: string;
  userName: string;
  email: string;
  roleName: string;
  mfaEnabled: boolean;
}

export interface IDatabase {
  _id: string;
  dbId: string;
  name: string;
  host: string;
  tables: ITable[];
  rlsEnabledForAllTables: boolean;
  pitrEnabled: boolean;
}

export interface ITable {
  _id: string;
  name: string;
  rlsEnabled: boolean;
}
