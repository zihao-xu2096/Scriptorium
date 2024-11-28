import { protectedRoute } from "@/middleware/auth";
import { NextApiRequest, NextApiResponse } from 'next';

interface ExtendedRequest extends NextApiRequest {
    user: {
      userType: string;
    };
  }


function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    console.log(req.user)
    return res.status(200).json({ userType: req.user.userType});
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

export default protectedRoute(handler, ['GET']);