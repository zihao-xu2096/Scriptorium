import { protectedRoute } from '../../middleware/auth';
import { prisma } from '@/prisma/prisma';

async function handler(req, res) {
    if (req.method === 'GET') {
        // Get userId from query parameters
        const userId = req.query.userId || req.user.id;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });

        // Handle case where user is not found
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        return res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNum: user.phoneNum,
            avatarUrl: user.avatarUrl
        });
    }
}

export default protectedRoute(handler, ['GET']);