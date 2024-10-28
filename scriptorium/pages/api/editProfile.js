import { verifyToken } from '../../utils/auth';


async function handler(req, res) {
    if (req.method === 'PUT') {
        const user = verifyToken(req.headers.authorization)

        if (!user) {
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

            const updatedUser = await primsa.user.update({
                where: {
                    id: user.id
                },
                data: updateData
            })

            return res.status(200).json({
                message: 'User updated successfully',
                user: updatedUser
            })

        } catch (error) {
            return res.status(500).json({ message: 'Internal Server Error' });
        }


    } else {
        res.status(405).json({ message: 'Method Not Allowed' });
    }
}