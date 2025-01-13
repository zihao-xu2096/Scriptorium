import { protectedRoute } from "@/middleware/auth";
import { NextApiRequest, NextApiResponse } from 'next';

interface ExtendedRequest extends NextApiRequest {
    user: {
      id: number;
    };
  }


function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    return res.status(200).json({ authorID: req.user.id });
  } else {
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

export default protectedRoute(handler, ['GET']);