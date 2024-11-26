import { User } from '@prisma/client'
import dotenv from 'dotenv'
import jwt, { PrivateKey, PublicKey } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN

dotenv.config()

export function generateAccessToken(user: User) {
    const payload = {
        id: user.id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNum: user.phoneNum || undefined,
        avatarUrl: user.avatarUrl || undefined
    }
    return jwt.sign(payload, JWT_SECRET as PrivateKey, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

export function generateRefreshToken(user: User) {
    const payload = {
        id: user.id,
        email: user.email,
        userType: user.userType,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNum: user.phoneNum || undefined,
        avatarUrl: user.avatarUrl || undefined
    }
    return jwt.sign(payload, JWT_REFRESH_SECRET as PrivateKey, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    })
}

export function verifyAccessToken(token: string | undefined) {
    if (!token?.startsWith('Bearer ')) { // If it doesn't stat with 'Bearer '
        return null;
    }

    else {
        token = token.split(' ')[1];
        try {
            return jwt.verify(token, JWT_SECRET as PublicKey);
        }
        catch (error) {
            return null;
        }
    }
}

export function verifyRefreshToken(token: string) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET as PublicKey);
    }
    catch (error) {
        return null;
    }
}
