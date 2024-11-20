import { prisma } from '@/prisma/prisma';
import { protectedRoute } from '@/middleware/auth';
import { ExtendedRequest } from '@/new-types';
import { NextApiResponse } from 'next';
import { Comment, Post } from '@prisma/client';

type BlogPostsQuery = {
  page?: string | number
  limit?: string | number
}

type HasReports = {
  _count: {
    reports: number
  }
}

async function handler(req: ExtendedRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const { page = 1, limit = 10 }: BlogPostsQuery = req.query;

    if (typeof(page) === "string" && !parseInt(page) || typeof(limit) === "string" && !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" });
      return;
    }

    if (req.user?.userType !== "ADMIN") {
      res.status(403).json({ message: "Insufficient permissions" });
      return;
    }

    const pageInt = typeof(page) === "string" ? parseInt(page) : page
    const limitInt = typeof(limit) === "string" ? parseInt(limit) : limit

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

    const combined: (HasReports)[] = [...posts ,...comments];
    combined.sort((a, b) => {
      return b._count.reports - a._count.reports;
    })

    res.status(200).json(combined.slice((pageInt - 1) * limitInt, pageInt * limitInt));
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}


export default protectedRoute(handler, ["GET"]);