import { readdir } from 'fs/promises';
import path from 'path';
import { prisma } from '../../prisma/prisma';
const bcrypt = require('bcrypt');

// TODO: Make sure status codes align with message i.e. 404 not found, 400 bad request etc

async function validateEmailFormat(email) {
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return false
    }
}

async function existingUser(email) {
    const existingUser = await prisma.user.findUnique({
        where: { email: email }
    });
    return existingUser;
}

function validatePassword(password, passwordConfirm) {
    return password.length >= 8 && password === passwordConfirm; // NOTE: Consider checking for capital letters, and symbols
}

async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            // Validate required fields
            const { email, firstName, lastName, password, passwordConfirm, phone} = req.body;

            if (!email || !firstName || !lastName || !password || !passwordConfirm) {
                return res.status(400).json({ 
                    error: 'Missing required fields: email, password, firstName, and lastName are required' 
                }); // Highlight missing ones in red?
            }

            if (!await validateEmailFormat(email)) {
                return res.status(400).json({ error: 'Invalid email format' });
            }

            if (await existingUser(email)) {
                return res.status(400).json({
                    message: "Email is already in use." // NOTE: Consider splitting these
                });
            }
            
            if (!validatePassword(password, passwordConfirm)) {
                return res.status(400).json({
                    message: "Password is not at minimum 8 characters or doesn't match." // NOTE: Consider splitting these
                });
            }

            if (phone) {
                const existingPhone = await prisma.user.findUnique({
                    where: { phoneNum: phone }
                });

                if (existingPhone) {
                    return res.status(400).json({
                        message: "Phone number is already in use."
                    });
                }
            }

            try {
                const hashedPassword = await bcrypt.hash(password, 10);

            const avatars = path.join(process.cwd(), 'public', 'avatars');
            const avatarFiles = await readdir(avatars);

            const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)]; // Could consider change logic to schema @defualt()?? 

                // Create User
                const user = await prisma.user.create({
                    data: {
                        email: email,
                        password: hashedPassword,
                        firstName: firstName,
                        lastName: lastName,
                        phoneNum: phone,
                        avatarUrl: `public/avatars/${randomAvatar}`
                    },
                    select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        userType: true,
                        avatar: true,
                        phoneNumber: true,
                        createdAt: true,
                        updatedAt: true,
                    }
                });

                return res.status(201).json({ message: 'User created successfully', user: user });

            } catch (error) {
                return res.status(500).json({ message: 'Internal server error' });
            }
        } catch (error) {
            console.error('Error creating user:', error);
            return res.status(500).json({ error: 'Error creating user' });
        }
    }

    else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
}

export default handler;