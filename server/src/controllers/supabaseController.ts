import { Request, Response } from 'express';
import User from '../models/User';
import axios from 'axios';
import { createSession, invalidateSession } from '../utils/utils';

export async function connectSupabase(req: Request, res: Response) {
  const { personalAccessToken } = req.body;

  if (!personalAccessToken) {
    return res.status(400).json({ message: 'Supabase Access token is required!' });
  }

  const { user } = res.locals;

  try {
    const dbUser = await User.findOne({ _id: user._id });

    if (!dbUser) {
      return res.status(400).json({ message: 'User not found!' });
    }

    if (dbUser.supabasePAT) {
      return res.status(400).json({ message: 'Already connected to Supabase!' });
    }

    // made this call just to check if access token is valid
    await axios
      .get('https://api.supabase.com/v1/organizations', {
        headers: {
          Authorization: `Bearer ${personalAccessToken}`,
        },
      })
      .then(async () => {
        dbUser.supabasePAT = personalAccessToken;
        dbUser.supabaseConnected = true;
        await dbUser.save();
        await invalidateSession(dbUser._id);
        const session = await createSession(dbUser);
        return res.status(200).json({ message: 'Successfully connected to Supabase!', session: session });
      })
      .catch((error) => {
        console.log('error ::', error);

        if (error.response?.status === 401) {
          return res.status(400).json({ message: 'Supabase Access token is invalid!' });
        }
        return res.status(500).json({ message: 'Internal Server Error' });
      });
  } catch (error) {
    console.log('error ::', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
