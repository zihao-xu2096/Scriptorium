async function handler(req, res) {
    if (req.method === 'POST') {
        
    } else {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }
}

export default handler;