import { verifyToken } from '../../utils/auth';

async function handler(req, res) {
    if (req.method === 'GET') {
        const user = verifyToken(req.headers.authorization)

        if (!user) {
            return res.status(401).json({
                message: 'User Unauthorized'
            })
        } // TODO: Try to generate new access token???

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