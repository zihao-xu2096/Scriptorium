import { prisma } from '../../../utils/db';

export default async function handler(req, res) {
  const { id } = req.query;
  const templateId = parseInt(id);

  if (isNaN(templateId)) {
    return res.status(400).json({ error: 'Invalid template ID' });
  }

  if (req.method === 'PUT') {
    try {
      const updatedTemplate = await prisma.codeTemplate.update({
        where: { id: templateId },
        data: {
          title: req.body.title,
          explanation: req.body.explanation,
          language: req.body.language,
          code: req.body.code,
        },
      });
      return res.json(updatedTemplate);
    } catch (error) {
      return res.status(404).json({ error: 'Template not found or update failed' });
    }
  }

  else if (req.method === 'DELETE') {
    try {
      await prisma.codeTemplate.delete({
        where: { id: templateId },
      });
      return res.status(204).end();
    } catch (error) {
      return res.status(404).json({ error: 'Template not found or delete failed' });
    }
  } 
  
  else {
    res.setHeader('Allow', ['PUT', 'DELETE']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}