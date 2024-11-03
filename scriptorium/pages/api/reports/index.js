import { prisma } from '@/prisma/prisma';

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { page = 1, limit = 10, sortBy } = req.query;

    if (!parseInt(page) || !parseInt(limit)) {
      res.status(400).json({ message: "Invalid page and limit values" });
      return;
    }

    if (sortBy && !(sortBy === "asc" || sortBy === "desc")) {
      res.status(400).json({ message: "Invalid sort value" });
      return;
    }

    const posts = await prisma.post.findMany({ 
      include: {
        reports: true,
        _count: {
          select: { reports: true }
        }
      },
      orderBy: {
        reports: {
          _count: {
            sortBy
          }
        }
      },
    });

    const comments = await prisma.comment.findMany({ 
      include: {
        reports: true,
        _count: {
          select: { reports: true }
        }
      },
      orderBy: {
        reports: {
          _count: {
            sortBy
          }
        }
      },
    });


    res.status(200).json(posts);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}