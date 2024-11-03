// pages/api/compile.js
import { exec } from 'child_process';
import { unlink, writeFile } from 'fs/promises';
import os from 'os';

const languages = {
    'c': {
        fileType: 'c',
        exec: './a.out',
        compile: 'gcc',
    },
    'c++': {
        fileType: 'cpp',
        exec: './a.out',
        compile: 'g++',
    },    
    'java': {
        fileType: 'java',
        exec: 'java',
        compile: 'javac',
    },
    'python': {
        fileType: 'py',
        exec: 'python'
    },
    'javascript': {
        fileType: 'js',
        exec: 'node'
    }
};

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { language, code, stdin } = req.body;

        if (!languages[language]) {
            return res.status(400).json({ message: 'Language not supported right now.' });
        }

        const { fileType, exec, compile} = languages[language];
        const fileName = `temp.${fileType}`;
        const tempDir = os.tmpdir();
        console.log(tempDir)
        const filePath = `${tempDir}/${fileName}`;

        try {

            await writeFile(filePath, code);

            if (compile) { // Requires compiling
                await execPromise(`${compile} ${filePath}`, stdin); // Compile code
            }

            const output = await execPromise(`${exec} ${filePath}`, stdin); // Async call to execute code

            await unlink(filePath); // Removes file

            return res.status(200).json({ 
                output: output });

        } catch (error) {
            console.error('Error executing code:', error);
            return res.status(500).json({ message: 'Internal server error', error: error });
        }
    } else {
        res.status(405).json({ message: 'Method Not Allowed'});
    }
}

function execPromise(command, stdin) {
    return new Promise((resolve, reject) => {
        const process = exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(stderr || error);
            } else {
                resolve(stdout);
            }
        });

        if (stdin) {
            process.stdin.write(stdin);
            process.stdin.end();
        }
    });
}