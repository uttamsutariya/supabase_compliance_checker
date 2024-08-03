import { Schema, model } from 'mongoose';
import { ICompliance, IDatabase, IOrgUser, IOrganization, ITable } from '../types';

const tableSchema = new Schema<ITable>({
  name: { type: String, required: true },
  rlsEnabled: { type: Boolean, required: true, default: false },
});

const databaseSchema = new Schema<IDatabase>({
  dbId: { type: String, required: true },
  name: { type: String, required: true },
  host: { type: String, required: true },
  rlsEnabledForAllTables: { type: Boolean, required: true, default: false },
  pitrEnabled: { type: Boolean, required: true, default: false },
  tables: [tableSchema],
});

const orgUserSchema = new Schema<IOrgUser>({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  email: { type: String, required: true },
  roleName: { type: String, required: true },
  mfaEnabled: { type: Boolean, required: true, default: false },
});

const organizationSchema = new Schema<IOrganization>({
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

const complianceSchema = new Schema<ICompliance>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    organizations: [organizationSchema],
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

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

const Compliance = model<ICompliance>('Compliance', complianceSchema);

export default Compliance;
