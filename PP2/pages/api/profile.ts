import { prisma } from '@/prisma/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { protectedRoute } from '../../middleware/auth';
interface ExtendedRequest extends NextApiRequest {
  user: {
    id: number;
  };
}

async function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNum: user.phoneNum,
      avatarUrl: user.avatarUrl,
      userType: user.userType
    });
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default protectedRoute(handler, ['GET']);