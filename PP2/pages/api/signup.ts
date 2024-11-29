import { prisma } from '@/prisma/prisma';
import bcrypt from 'bcrypt';
import { readdir } from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';

interface User {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  passwordConfirm: string;
  phone: string;
}

async function validateEmailFormat(email: string): Promise<boolean> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function existingUser(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return !!user;
}

function validatePassword(password: string, passwordConfirm: string): boolean {
  return password.length >= 8 && password === passwordConfirm;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const { email, firstName, lastName, password, passwordConfirm, phone }: User = req.body;

      if (!email || !firstName || !lastName || !password || !passwordConfirm || !phone) {
        return res.status(400).json({
          message: 'Missing required fields: email, password, firstName, lastName, and phone are required',
        });
      }

      if (!(await validateEmailFormat(email))) {
        return res.status(400).json({ message: 'Invalid email format' });
      }

      if (await existingUser(email)) {
        return res.status(400).json({ message: 'Email is already in use.' });
      }

      if (!validatePassword(password, passwordConfirm)) {
        return res.status(400).json({
          message: "Password is not at minimum 8 characters or doesn't match.",
        });
      }

      if (phone) {
        const existingPhone = await prisma.user.findUnique({
          where: { phoneNum: phone },
        });

        if (existingPhone) {
          return res.status(400).json({ message: 'Phone number is already in use.' });
        } else {
          const phoneRegex = /^\d{10}$/;
          if (!phoneRegex.test(phone)) {
            return res.status(400).json({ message: 'Phone number must be 10 digits.' });
          }
        }
      }

      try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const avatars = path.join(process.cwd(), 'public', 'avatars');
        const avatarFiles = await readdir(avatars);

        const randomAvatar = avatarFiles[Math.floor(Math.random() * avatarFiles.length)];

        const user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            firstName,
            lastName,
            phoneNum: phone,
            avatarUrl: `/avatars/${randomAvatar}`,
          },
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
          },
        });

        return res.status(201).json({ message: 'User created successfully', user });
      } catch (error: any) {
        return res.status(500).json({ message: `Internal server error: ${error.message}` });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ message: 'Error creating user' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}

export default handler;