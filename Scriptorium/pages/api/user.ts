import { prisma } from "@/prisma/prisma";
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ message: "userId is required" });
    }

    try {
      const parsedId = parseInt(userId, 10);
      const user = await prisma.user.findUnique({
        where: {
          id: parsedId,
        },
        select: {
          firstName: true,
          lastName: true,
        },
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}

export default handler;