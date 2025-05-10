import { protectedRoute } from '@/middleware/auth';
import { ExtendedRequest } from '@/new-types';
import { prisma } from '@/prisma/prisma';
import { NextApiResponse } from 'next';

async function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { id } = req.query;
    console.log("id", id);
    if (id) {
      const report = await prisma.report.findUnique({
        where: { id: parseInt(id as string) },
        include: {
          post: true,
          comment: true,
          createdBy: true,
        },
      });

      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }

      return res.status(200).json(report);
    }

    // Existing code for fetching reported posts and comments...
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default protectedRoute(handler, ["GET"]);