import { generateAccessToken, verifyRefreshToken } from '@/utils/tokens';
import { NextApiRequest, NextApiResponse } from 'next';
async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Refresh Token Required' });
    }

    const refreshToken = authHeader.split(' ')[1];
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh Token Required' });
    }

    const user = verifyRefreshToken(refreshToken);

    if (!user) {
      return res.status(401).json({ message: 'Refresh Token Expired' });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      message: 'Access Token Refreshed',
      accessToken: newAccessToken,
    });
  } else {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default handler;