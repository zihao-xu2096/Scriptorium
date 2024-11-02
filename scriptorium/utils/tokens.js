import jwt from 'jsonwebtoken';
const JWT_SECRET = 'adfjasjdflasja89d(&(*&d9u1df'
const JWT_EXPIRES_IN = '1h'
const JWT_REFRESH_SECRET = 'adfasdfasdfasdfasdfasdf'
const JWT_REFRESH_EXPIRES_IN = '7d'

export function generateAccessToken(user) {
    const payload ={
        id: user.id,
        email: user.email,
    }
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    })
}

export function generateRefreshToken(user) {
    const payload ={
        id: user.id,
        email: user.email,
    }
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    })
}

export function verifyAccessToken(token) {
    if (!token?.startsWith('Bearer ')) { // If it doesn't stat with 'Bearer '
        return null;
    }

    else {
        token = token.split(' ')[1];
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            return null;
        }
    }
}

export function verifyRefreshToken(token) {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    }
    catch (error) {
        return null;
    }
}
