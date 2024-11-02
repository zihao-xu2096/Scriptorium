import { readdir } from 'fs/promises';
import path from 'path';
import { prisma } from '../../prisma/prisma';
const bcrypt = require('bcrypt');

// TODO: Make sure status codes align with message i.e. 404 not found, 400 bad request etc

async function validateEmail(email) {
    if (!email.includes('@')) {
        return false;
    }
    const existingUser = await prisma.user.findUnique({
        where: { email: email }
    });
    return !existingUser;
}

function validatePassword(password, passwordConfirm) {
    return password.length >= 8 && password === passwordConfirm; // NOTE: Consider checking for capital letters, and symbols
}

async function handler(req, res) {
    if (req.method === 'POST') {
        const { email, firstName, lastName, password, passwordConfirm, phone } = req.body;

        if (!email || !firstName || !lastName || !password || !passwordConfirm || !phone) {
            return res.status(400).json({ message: 'Please fill all fields' }); // Highlight missing ones in red?
        }

        if (!await validateEmail(email)) {
            return res.status(400).json({
                message: "Email is not valid or already in use." // NOTE: Consider splitting these
            });
        }

        if (!validatePassword(password, passwordConfirm)) {
            return res.status(400).json({
                message: "Password is not at minimum 8 characters or doesn't match." // NOTE: Consider splitting these
            });
        }

        const existingPhone = await prisma.user.findUnique({
            where: { phoneNum: phone }
        });

        if (existingPhone) {
            return res.status(400).json({
                message: "Phone number is already in use."
            });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const avatars = path.join(process.cwd(), 'public', 'avatars');
            const avatarFiles = await readdir(avatars);

            const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];

            // Create User
            const user = await prisma.user.create({
                data: {
                    email: email,
                    password: hashedPassword,
                    firstName: firstName,
                    lastName: lastName,
                    phoneNum: phone,
                    avatarUrl: `public/avatars/${randomAvatar}`
                }
            });

            return res.status(201).json({ message: 'User created successfully', user: user });
        } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}

export default handler;