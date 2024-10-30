// Refresh token API by creating a new file in the pages/api directory called refreshToken.js.
// This file will be responsible for generating a new access token when the current access token expires.
// The refreshToken.js file will contain the following code:
import { generateAccessToken, verifyRefreshToken } from '../../utils/auth';


async function handler(req, res) {
    if (req.method === 'GET') {
        const refreshToken = req.headers.authorization.split(' ')[1];
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh Token Required' });
        }

        const user = verifyRefreshToken(refreshToken);
        console.log(user);

        if (!user) {
            return res.status(401).json({ message: 'Refresh Token Expired' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user); 

        return res.status(200).json({
            message: 'Access Token Refreshed',
            token: newAccessToken
        })

    }
    else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}

export default handler;