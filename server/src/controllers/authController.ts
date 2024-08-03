import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import config from '../config';
import User from '../models/User';
import { createSession, getSession, invalidateSession } from '../utils/utils';

const client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

export const authenticate = async (req: Request, res: Response) => {
  const { credential, client_id } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: client_id,
    });

    const payload = ticket.getPayload();

    if (payload) {
      const { sub, email, name, picture } = payload;

      let user = await User.findOne({ googleId: sub });

      if (!user) {
        user = new User({
          googleId: sub,
          email,
          name,
          picture,
        });
        await user.save();
      }

      const token = jwt.sign(
        {
          _id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
        config.JWT_SECRET
      );

      const session = await createSession(user);

      return res.status(200).json({
        token,
        session,
      });
    } else {
      return res.status(400).json({ message: 'Invalid payload' });
    }
  } catch (error) {
    console.log('error ::', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const getSecret = async (req: Request, res: Response) => {
  const { user } = res.locals;
  const session = await getSession(user._id);
  return res.status(200).json({ session });
};

export const logout = async (req: Request, res: Response) => {
  const { user } = res.locals;
  const session = await invalidateSession(user._id);
  return res.status(200).json({ session });
};
