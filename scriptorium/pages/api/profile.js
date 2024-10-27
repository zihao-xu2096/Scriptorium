import { prisma } from '../../prisma/prisma'
import { verifyToken } from '../../utils/auth'

async function handler(req, res) {
    if (req.method === 'GET') {
        const { email, token } = req.body

        if (!email || !token) {
            return res.status(400).json({
                message: 'Please provide an email or token'
            })
        }

        if (!verifyToken(token)) {
            return res.status(401).json({
                message: 'User Unauthorized'
            })
        } // TODO: Try to generate new access token???
        
        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        return res.status(200).json({
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNum: user.phoneNum,
            avatarUrl: user.avatarUrl
        })
    }
}

export default handler