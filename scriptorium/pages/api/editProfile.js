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

export default protectedRoute(handler)