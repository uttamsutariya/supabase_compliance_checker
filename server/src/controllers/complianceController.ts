import { Request, Response } from 'express';
import ComplianceManager from '../managers/complianceManager';
import { getSession } from '../utils/utils';
import User from '../models/User';
import { redisClient } from '../config';
import { LATEST_COMPLIANCE_REDIS_KEY } from '../constants';
import Compliance from '../models/Compliance';

export async function syncCompliance(req: Request, res: Response) {
  try {
    const userId = res.locals.user._id;

    const latestCompliance = await Compliance.findOne({ user: userId }).sort({ createdAt: -1 }).limit(1);

    if (latestCompliance) {
      // @ts-ignore
      const latestComplianceTimestamp = +new Date(latestCompliance?.createdAt);
      const currentComplianceTimestamp = +new Date();
      const diffInMinutes = Math.round((currentComplianceTimestamp - latestComplianceTimestamp) / (1000 * 60));

      if (diffInMinutes < 1) {
        return res.status(200).json(latestCompliance);
      }
    }
    const dbUser = await User.findOne({ _id: userId }, { supabasePAT: 1 });

    if (!dbUser) {
      return res.status(400).json({ message: 'User not found!' });
    }

    const accessToken = dbUser.supabasePAT;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required!, please connect to Supabase first!' });
    }

    const complianceManager = new ComplianceManager(accessToken, userId);

    const compliance = await complianceManager.getCompliance();

    await redisClient.set(`${LATEST_COMPLIANCE_REDIS_KEY}:${userId}`, JSON.stringify(compliance));

    return res.status(200).json(compliance);
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export async function getCompliance(req: Request, res: Response) {
  try {
    const { supabaseConnected } = await getSession(res.locals.user._id);

    if (!supabaseConnected) {
      return res.status(400).json({ message: 'Please connect to Supabase first!' });
    }

    const userId = res.locals.user._id;

    // fetch latest compliance data from redis
    const latestCompliance = await redisClient.get(`${LATEST_COMPLIANCE_REDIS_KEY}:${userId}`);

    if (!latestCompliance) {
      // not found from redis, means no compliance data exists for the user
      // fetch it from complaince manager and save it to redis
      const dbUser = await User.findOne(
        { _id: userId },
        {
          supabasePAT: 1,
        }
      );

      if (!dbUser) {
        return res.status(400).json({ message: 'User not found!' });
      }

      const accessToken = dbUser.supabasePAT;

      if (!accessToken) {
        return res.status(400).json({ message: 'Access token is required!, please connect to Supabase first!' });
      }

      const complianceManager = new ComplianceManager(accessToken, userId);

      const compliance = await complianceManager.getCompliance();

      await redisClient.set(`${LATEST_COMPLIANCE_REDIS_KEY}:${userId}`, JSON.stringify(compliance));

      return res.status(200).json(compliance);
    }

    return res.status(200).json(JSON.parse(latestCompliance));
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}
