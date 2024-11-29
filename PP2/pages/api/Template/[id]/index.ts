import { prisma } from "@/prisma/prisma";
import { NextApiRequest, NextApiResponse } from "next";
import { protectedRoute } from "../../../../middleware/auth";

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
    const updates: UpdateTemplateBody = req.body;

    // Validate that at least one field is being updated
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: "No update fields provided",
      });
    }

    // Add template existence check
    const existingTemplate = await prisma.codeTemplate.findUnique({
      where: { id: templateId },
    });

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    // Validate tags format if provided
    if (updates.tags && !Array.isArray(updates.tags)) {
      return res.status(400).json({
        error: "Tags must be an array of strings",
      });
    }

    if (!existingTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }

    try {
      const updatedTemplate = await prisma.codeTemplate.update({
        where: { id: templateId },
        data: {
          ...(updates.title && { title: updates.title.trim() }),
          ...(updates.explanation && {
            explanation: updates.explanation.trim(),
          }),
          ...(updates.language && {
            language: updates.language.toLowerCase().trim(),
          }),
          ...(updates.code && { code: updates.code }),
          updatedAt: new Date(),
          ...(updates.tags && {
            tags: {
              disconnect: await prisma.templateTag.findMany({
                where: { codeTemplates: { some: { id: templateId } } },
                select: { id: true },
              }),
              connectOrCreate: updates.tags.map((tag) => ({
                where: { name: tag.toLowerCase().trim() },
                create: { name: tag.toLowerCase().trim() },
              })),
            },
          }),
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
  } else if (req.method === "DELETE") {
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
