import { protectedRoute } from '../../middleware/auth';
import { prisma } from '../../prisma/prisma';

async function handler(req, res) {
    if (req.method === 'GET') {
        const user = await prisma.user.findUnique({
            where: {
                id: req.user.id
            }
        })

        // TODO: Consider checking user exists (should exist since logged in)
        return res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNum: user.phoneNum,
            avatarUrl: user.avatarUrl
        })
    }
    else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}

export default protectedRoute(handler, ['GET']);