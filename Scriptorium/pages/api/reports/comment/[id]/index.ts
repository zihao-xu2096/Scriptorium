import { protectedRoute } from '@/middleware/auth';
import { ExtendedRequest } from '@/new-types';
import { prisma } from '@/prisma/prisma';
import { NextApiResponse } from 'next';

async function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Comment ID is required" });
    }

    try {
      const commentIdInt = parseInt(id as string);

        // Fetch all reports for the given comment ID
        const reports = await prisma.report.findMany({
            where: {
            commentId: commentIdInt
            },
            include: {
            createdBy: true,
            comment: true,
            },
        });

      if (reports.length === 0) {
        return res.status(404).json({ message: "No reports found for this comment" });
      }

      return res.status(200).json(reports);
    } catch (error) {
      console.error("Error fetching reports:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

export default protectedRoute(handler, ["GET"]);