import { verifyAccessToken } from '../utils/tokens.js';

export function protectedRoute(handler, protectedMethods) {
    return async (req, res) => {

        if (!protectedMethods.includes(req.method)) {
            return handler(req, res);
        }

        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = verifyAccessToken(token);
        if (!decoded && protectedMethods.includes(req.method)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = decoded;

        // Call handler API logic
        return handler(req, res);
    };
}