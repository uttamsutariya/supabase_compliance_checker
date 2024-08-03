import { ObjectId } from 'mongoose';

export interface IUser {
  _id: string;
  googleId: string;
  email: string;
  name: string;
  picture: string;
  supabasePAT: string;
  supabaseConnected: boolean;
}

export interface ICompliance {
  _id: string;
  user: ObjectId;
  organizations: IOrganization[];
}

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
