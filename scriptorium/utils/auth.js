import jwt from 'jsonwebtoken';
const JWT_SECRET = 'adfjasjdflasja89d(&(*&d9u1df'
const JWT_EXPIRES_IN = '1h'

export function generateToken(user) {
    return jwt.sign(user, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

export function verifyToken(token) {
    if (!token) {
        return null;
    }
    else {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
}