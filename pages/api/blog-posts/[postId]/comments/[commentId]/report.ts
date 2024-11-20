import { prisma } from '@/prisma/prisma';
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "@/middleware/auth";
import { ApiError, ExtendedRequest } from '@/new-types';
import { NextApiResponse } from 'next';
import { Report } from '@prisma/client';

type CommentQuery = {
  postId?: string
  commentId?: string
}

type CreateReportBody = {
  explanation: string
}

async function handler(req: ExtendedRequest, res: NextApiResponse<Report | ApiError>) {
  if (req.method === "POST") {
    //creating a report
    const { commentId: id, postId }: CommentQuery = req.query;
    const { explanation }: CreateReportBody = req.body;

    if (!id || !postId ) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id) || !parseInt(postId)) {
      res.status(400).json({ message: "Invalid ID type provided" })
      return;
    }

    if (!explanation) {
      res.status(400).json({ message: "Explanation not provided" })
      return;
    }

    try {
      const report = await prisma.report.create({
        data: {
          explanation,
          comment: {
            connect: {
              id: parseInt(id),
              post: {
                id: parseInt(postId)
              }
            }
          },
          createdBy: {
            connect: {
              id: req.user?.id
            }
          }
        }
      })

      res.status(201).json(report);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(400).json({ message: 'Comment not found' });
          return;
        }
        res.status(400).json({ message: `error ${error.code}: ${error.message}` });
        return;
      } 
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ["POST"]);