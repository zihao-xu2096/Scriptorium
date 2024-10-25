import { prisma } from '../../prisma/prisma';

const bcrypt = require('bcrypt');

async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: 'Please provide an email and password'
            })
        }

        const user = await prisma.user.findUnique({
            where: {
                email: email
            }
        })

        if (!user) {
            return res.status(404).json({
                message: 'Incorrect email or password'
            })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                message: 'Incorrect email or password'
            })
        }

        const token = generateToken(user);

        return res.status(200).json({
            message: 'Verified',
            token: token
        })
    }
    else {
        res.status(405).json({ message: 'Method Not Allowed'});
    }
}