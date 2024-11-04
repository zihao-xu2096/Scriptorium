import { prisma } from '@/prisma/prisma';
import { protectedRoute } from '../../../middleware/auth';

async function handler(req, res) {
  if (req.method === "GET") {
    const { page = 1, limit = 10 } = req.query;

    if (!parseInt(page) || !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" });
      return;
    }

    if (req.user.userType !== "ADMIN") {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    const posts = await prisma.post.findMany({ 
      include: {
        reports: true,
        _count: {
          select: { reports: true }
        }
      }
    });

    const comments = await prisma.comment.findMany({ 
      include: {
        reports: true,
        _count: {
          select: { reports: true }
        }
      }
    });

    const combined = [].concat(posts).concat(comments);
    combined.sort((a, b) => {
      return b._count.reports - a._count.reports;
    })

    res.status(200).json(combined.slice((page - 1) * limit, page * limit));
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}


export default protectedRoute(handler, ["GET"]);