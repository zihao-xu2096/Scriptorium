// pages/api/compile.js
import axios from 'axios';

const JUDGE0_API_URL = 'https://judge0-ce.p.rapidapi.com/submissions';
const JUDGE0_API_KEY = 'f0617a1334msh958d68a6a169efdp1ae03cjsnf72faaf95289'; // Replace with your RapidAPI key

const languageMap = {
    'c': 50,
    'cpp': 54,
    'java': 62,
    'python': 71,
    'javascript': 63
};

async function handler(req, res) {
    if (req.method === 'POST') {
        const { language, code, stdin } = req.body;

        if (!languageMap[language]) {
            return res.status(400).json({ message: 'Unsupported language' });
        }

        try {
            const response = await axios.post(
                `${JUDGE0_API_URL}?base64_encoded=false&wait=true`,
                {
                    source_code: code,
                    language_id: languageMap[language],
                    stdin: stdin,
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
                        'X-RapidAPI-Key': JUDGE0_API_KEY,
                    },
                }
            );

            return res.status(200).json(response.data);
        } catch (error) {
            console.error('Error compiling code:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}

export default handler