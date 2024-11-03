import { protectedRoute } from '../../middleware/auth';
import { prisma } from '../../prisma/prisma';

async function handler(req, res) {
    if (req.method === 'PUT') {
        
        const { firstName, lastName, phoneNum, avatarUrl } = req.body;
        const updateData = {};

        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phoneNum) updateData.phoneNum = phoneNum;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        try {
            const updatedUser = await prisma.user.update({
                where: {
                    id: req.user.id
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
                }
            })

            return res.status(200).json({
                message: 'User updated successfully',
                user: updatedUser
            })

        } catch (error) {
            console.error('Error updating user:', error);
            res.status(500).json({ error: 'Error updating user' });
        }


    } else {
        res.setHeader('Allow', ['PUT']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}

export default protectedRoute(handler, ['PUT']);