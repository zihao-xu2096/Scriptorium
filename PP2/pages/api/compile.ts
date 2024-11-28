// pages/api/compile.ts
import { exec } from 'child_process';
import { unlink, writeFile } from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';
import os from 'os';
import path from 'path';

interface LanguageConfig {
  fileType: string;
  exec: string;
  compile?: string;
  compileArgs?: (input: string, output: string) => string[];
}

const languages: Record<string, LanguageConfig> = {
  'c': {
    fileType: 'c',
    exec: process.platform === 'win32' ? '.\\a.exe' : './a.out',
    compile: 'gcc',
    compileArgs: (input, output) =>
      process.platform === 'win32'
        ? [`${input}`, `-o`, `${output}.exe`]
        : [`${input}`, `-o`, output]
  },
  'c++': {
    fileType: 'cpp',
    exec: process.platform === 'win32' ? '.\\a.exe' : './a.out',
    compile: 'g++',
    compileArgs: (input, output) =>
      process.platform === 'win32'
        ? [`${input}`, `-o`, `${output}.exe`]
        : [`${input}`, `-o`, output]
  },
  'cpp': {
    fileType: 'cpp',
    exec: process.platform === 'win32' ? '.\\a.exe' : './a.out',
    compile: 'g++',
    compileArgs: (input, output) =>
      process.platform === 'win32'
        ? [`${input}`, `-o`, `${output}.exe`]
        : [`${input}`, `-o`, output]
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { language, code, stdin } = req.body;
    const tempDir = os.tmpdir();
    const isWindows = process.platform === 'win32';

    if (!languages[language]) {
      return res.status(400).json({ message: 'Language not supported right now.' });
    }

    const { fileType, exec, compile, compileArgs } = languages[language];
    const fileName = `temp.${fileType}`;
    const filePath = path.join(tempDir, fileName);
    const outputPath = path.join(tempDir, 'a');

    try {
      await writeFile(filePath, code);

      if (compile) {
        try {
          let compileCommand;
          if (compileArgs) {
            const args = compileArgs(filePath, outputPath);
            compileCommand = `${compile} ${args.join(' ')}`;
          } else {
            compileCommand = `${compile} "${filePath}"`;
          }

          console.log('Compiling with:', compileCommand);
          await execPromise(compileCommand);
        } catch (compileError) {
          return res.status(400).json({
            message: 'Compilation failed',
            error: (compileError instanceof Error ? compileError.toString() : 'Unknown error')
          });
        }
      }

      let execCommand;
      if (['c', 'c++', 'cpp'].includes(language)) {
        const exePath = path.join(tempDir, isWindows ? 'a.exe' : 'a.out');
        execCommand = `"${exePath}"`;
      } else if (language === 'java') {
        execCommand = `${exec} -cp "${tempDir}" Main`;
      } else {
        execCommand = `${exec} "${filePath}"`;
      }

      const output = await execPromise(execCommand, stdin); // Async call to execute code

      // Cleanup
      await unlink(filePath);
      if (['c', 'c++', 'cpp'].includes(language)) {
        const exePath = path.join(tempDir, isWindows ? 'a.exe' : 'a.out');
        await unlink(exePath).catch(() => {});
      }

      if (language === 'java') {
        await unlink(path.join(tempDir, `Main.class`)); // Remove the .class file
      }

      return res.status(200).json({
        output: output
      });

    } catch (error) {
      console.error('Error executing code:', error);
      return res.status(400).json({
        message: 'Code could not compile check for errors.',
        error: error instanceof Error ? error.toString() : 'Unknown error'
      });
    }
  } else {
    res.status(405).json({ message: 'Method Not Allowed' });
  }
}

function execPromise(command: string, stdin?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || error);
      } else {
        resolve(stdout);
      }
    });

    if (stdin) {
      if (process.stdin) {
        process.stdin.write(stdin);
      }
      if (process.stdin) {
        process.stdin.end();
      }
    }
  });
}