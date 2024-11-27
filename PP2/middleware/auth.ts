import { verifyAccessToken } from '@/utils/tokens';
import { NextApiRequest, NextApiResponse } from 'next';

export function protectedRoute(handler: Function, protectedMethods: string[]) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
        const token = req.headers.authorization;

        if (!token && req.method && protectedMethods.includes(req.method)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const decoded = verifyAccessToken(token);
        if (!decoded && req.method && protectedMethods.includes(req.method)) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Call handler API logic
        return handler({ ...req, ...(decoded ? { user :decoded } : {}) }, res);
    };
}