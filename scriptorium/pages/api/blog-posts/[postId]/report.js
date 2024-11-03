import { prisma } from '@/prisma/prisma';

import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { protectedRoute } from "../../../../middleware/auth";

async function handler(req, res) {
  if (req.method === "POST") {
    //creating a report
    const { postId: id } = req.query;
    const { explanation } = req.body;

    if (!id) {
      res.status(400).json({ message: "ID not provided" })
      return;
    }

    if (!parseInt(id)) {
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
          createdBy: {
            connect: {
              id: req.user.id
            }
          },
          post: {
            connect: {
              id: parseInt(id)
            }
          }
        }
      })

      res.status(201).json(report);
      return;

    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        if (error.code === 'P2003' || error.code === 'P2025') {
          res.status(400).json({ message: 'Post or user not found' });
          return;
        }
        res.status(400).json({message: `threw a ${error.code} instead. ${error.message}`})
      } 
      else {
        res.status(500).json({message: error.message});
      }
    }
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}

export default protectedRoute(handler, ['POST']);