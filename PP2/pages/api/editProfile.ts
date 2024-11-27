import { prisma } from '@/prisma/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { protectedRoute } from '../../middleware/auth';
interface ExtendedRequest extends NextApiRequest {
  user: {
    id: number;
  };
}

async function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === 'PUT') {
    const { firstName, lastName, phoneNum, avatarUrl } = req.body;
    const updateData: { [key: string]: any } = {};

    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phoneNum) {
      // Validate phone number format
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phoneNum)) {
        return res.status(400).json({
          message: 'Phone number must be 10 digits.',
        });
      }
      updateData.phoneNum = phoneNum;
    }
    if (avatarUrl) updateData.avatarUrl = avatarUrl;

    try {
      const updatedUser = await prisma.user.update({
        where: {
          id: req.user.id,
        },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          avatarUrl: true,
          phoneNum: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser,
      });
    } catch (error: any) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Error updating user' });
    }
  } else {
    res.setHeader('Allow', ['PUT']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

export default protectedRoute(handler, ['PUT']);