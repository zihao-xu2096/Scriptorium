import { protectedRoute } from '@/middleware/auth';
import { prisma } from '@/prisma/prisma';
import { NextApiRequest, NextApiResponse } from 'next';

interface CreateTemplateBody {
  title: string;
  explanation: string;
  language: string;
  code: string;
  authorId: number;
  tags?: string[];
  parentId?: number;
}

interface QueryParams {
  id?: string;
  authorId?: string;
  language?: string;
  tag?: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      // Validate required fields
      const { title, explanation, language, code, authorId, tags, parentId }: CreateTemplateBody = req.body;
      
      if (!title || !explanation || !language || !code || !authorId) {
        return res.status(400).json({ 
          error: 'Missing required fields: title, explanation, language, code, and authorId are required' 
        });
      } 

      // Verify author exists
      const authorExists = await prisma.user.findUnique({
        where: { id: authorId }
      });

      if (!authorExists) {
        return res.status(400).json({ error: 'Author ID not found' });
      }

      let parentTemplate = null;

      // If parentId is provided, verify the template exists
      if (parentId) {
        parentTemplate = await prisma.codeTemplate.findUnique({
          where: { id: parentId }
        });
      }

      // Create template with optional tags
      const template = await prisma.codeTemplate.create({
        data: {
          title,
          explanation,
          language: language.toLowerCase(),
          code,
          author: {
            connect: { id: authorId }
          },
          ...(parentTemplate && {  // Only include parent if parentTemplate exists
            parent: {
              connect: { id: parentTemplate.id }
            }
          }),
          ...(tags && {
            tags: {
              connectOrCreate: tags.map(tagName => ({
                where: { name: tagName.toLowerCase() },
                create: { name: tagName.toLowerCase() }
              }))
            }
          })
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          parent: {
            select: {
              id: true,
              title: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          tags: true
        }
      });

      if (parentTemplate) {
        res.status(201).json({
          message: `Template successfully forked from "${parentTemplate.title}".`,
          template
        });
      } else {
        res.status(201).json({
          message: 'Template successfully created',
          template
        });
      }

    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Error creating template' });
    }
  }

  else if (req.method === 'GET') {
    try {
      const { id, authorId, language, tag }: QueryParams = req.query;

      let whereClause: any = {};
      
      // Build where clause based on provided query parameters
      if (id) {
        whereClause.id = parseInt(id);
      }
      if (authorId) {
        whereClause.authorId = parseInt(authorId);
      }
      if (language) {
        whereClause.language = {
          contains: language.toLowerCase()
        };
      }
      if (tag) {
        whereClause.tags = {
          some: {
            name: {
              contains: tag.toLowerCase()
            }
          }
        };
      }

      const templates = await prisma.codeTemplate.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          tags: true,
          savedBy: {
            select: {
              id: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      if (id && templates.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.status(200).json(templates);

    } catch (error) {
      console.error('Error retrieving templates:', error);
      res.status(500).json({ error: 'Error retrieving templates' });
    }
  }

  else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

export default protectedRoute(handler, ['POST']);