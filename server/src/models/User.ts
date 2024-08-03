import { Schema, model } from 'mongoose';
import { IUser } from '../types';

const userSchema = new Schema<IUser>(
  {
    googleId: { type: String, required: true },
    email: { type: String, required: true },
    name: { type: String, required: true },
    picture: { type: String, required: true },
    supabasePAT: { type: String, required: false, default: '', select: false },
    supabaseConnected: { type: Boolean, required: false, default: false },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

const User = model<IUser>('User', userSchema);

export default User;
