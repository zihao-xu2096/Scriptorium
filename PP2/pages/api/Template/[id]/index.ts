import { prisma } from '@/prisma/prisma';
import { NextApiRequest, NextApiResponse } from 'next';
import { protectedRoute } from '../../../../middleware/auth';

interface UpdateTemplateBody {
  title: string;
  explanation: string;
  language: string;
  code: string;
  tags?: string[];
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;
  const templateId = parseInt(id as string);

  if (isNaN(templateId)) {
    return res.status(400).json({ error: "Invalid template ID" });
  }

  // TODO: Need to check sessionID is the same as template.authorID

  if (req.method === "PUT") {
    const { title, explanation, language, code, tags }: UpdateTemplateBody = req.body;

    // Validate required fields
    if (!title || !explanation || !language || !code) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          title: !title ? "Title is required" : null,
          explanation: !explanation ? "Explanation is required" : null,
          language: !language ? "Language is required" : null,
          code: !code ? "Code is required" : null,
        },
      });
    }

    // Validate tags format if provided
    if (tags && !Array.isArray(tags)) {
      return res.status(400).json({
        error: "Tags must be an array of strings",
      });
    }

    // Add template existence check
    const existingTemplate = await prisma.codeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    try {
      const updatedTemplate = await prisma.codeTemplate.update({
        where: { id: templateId },
        data: {
          title: title.trim(),
          explanation: explanation.trim(),
          language: language.toLowerCase().trim(),
          code,
          updatedAt: new Date(),
          tags: {
            // Disconnect all existing tags
            disconnect: await prisma.templateTag.findMany({
              where: { codeTemplates: { some: { id: templateId } } },
              select: { id: true },
            }),
            // Connect or create new tags
            connectOrCreate:
              tags?.map((tag) => ({
                where: { name: tag.toLowerCase().trim() },
                create: { name: tag.toLowerCase().trim() },
              })) || [],
          },
        },
        include: {
          tags: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });
      return res.json(updatedTemplate);
    } catch (error) {
      console.error("Template update error:", error);
      return res.status(500).json({ error: "Update failed" });
    }
  } 
  
  else if (req.method === "DELETE") {
    try {
      await prisma.codeTemplate.delete({
        where: { id: templateId },
      });
      return res.status(204).end();
    } catch (error) {
      return res
        .status(404)
        .json({ error: "Template not found or delete failed" });
    }
  } else {
    res.setHeader("Allow", ["PUT", "DELETE"]);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

export default protectedRoute(handler, ["PUT", "DELETE"]);