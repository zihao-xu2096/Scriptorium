import { prisma } from '../../prisma/prisma';
import { verifyAccessToken } from '../../utils/auth';


async function handler(req, res) {
    if (req.method === 'PUT') {
        const decoded = verifyAccessToken(req.headers.authorization)

        if (!decoded) { // Return 401 if token is invalid and let frontend handle calling refresh token 
            return res.status(401).json({
                message: 'User Unauthorized'
            })
        }

        const { firstName, lastName, phoneNum, avatarUrl } = req.body;
        const updateData = {};

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phoneNum) updateData.phoneNum = phoneNum;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        try {

            const updatedUser = await prisma.user.update({
                where: {
                    id: decoded.id
                },
                data: updateData
            })

            return res.status(200).json({
                message: 'User updated successfully',
                user: updatedUser
            })

        } catch (error) {
            console.error(error)
            return res.status(500).json({ message: 'Internal Server Error' });
        }


    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}

export default handler