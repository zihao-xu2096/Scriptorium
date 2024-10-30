import { prisma } from '../../prisma/prisma';
import { verifyAccessToken } from '../../utils/auth';


async function handler(req, res) {
    if (req.method === 'GET') {
        const decoded = verifyAccessToken(req.headers.authorization) // Checks Token timestamp
        // If token is invalid, return 401

        if (!decoded) { 
            //TODO: Try to generate new access token, if refresh token is valid
            return res.status(401).json({
                message: 'Token Expired' // FRONTEND responsible for sending another request to create new access token
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.id
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

export default handler