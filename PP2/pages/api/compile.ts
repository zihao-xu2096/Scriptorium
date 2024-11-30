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
    exec: process.platform === 'win32' ? '.\\a.exe' : './a',
    compile: 'gcc',
    compileArgs: (input, output) =>
      process.platform === 'win32'
        ? [`${input}`, `-o`, `${output}.exe`]
        : [`${input}`, `-o`, output]
  },
  'cpp': {
    fileType: 'cpp',
    exec: process.platform === 'win32' ? '.\\a.exe' : './a',
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
    compileArgs: (input, output) => [input]
  },
  'python': {
    fileType: 'py',
    exec: 'python3'
  },
  'javascript': {
    fileType: 'js',
    exec: 'node'
  },
  'typescript': {
    fileType: 'ts',
    exec: 'node',
    compile: 'tsc',
    compileArgs: (input, output) => [input, '--outDir', path.dirname(output)]
  },
  'ruby': {
    fileType: 'rb',
    exec: 'ruby'
  },
  'go': {
    fileType: 'go',
    exec: process.platform === 'win32' ? '.\\a.exe' : './a',
    compile: 'go build',
    compileArgs: (input, output) => ['-o', output, input]
  },
  'php': {
    fileType: 'php',
    exec: 'php'
  },
  'rust': {
    fileType: 'rs',
    exec: process.platform === 'win32' ? '.\\a.exe' : './a',
    compile: 'rustc',
    compileArgs: (input, output) =>
      process.platform === 'win32'
        ? [`${input}`, `-o`, `${output}.exe`]
        : [`${input}`, `-o`, output]
  },
  'shell': {
    fileType: 'sh',
    exec: 'sh'
  }
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { language, code, stdin } = req.body;
    const tempDir = os.tmpdir();
    const isWindows = process.platform === 'win32';

    if (!languages[language]) {
      console.log('Language not supported:', language);
      return res.status(400).json({ message: 'Language not supported right now.' });
    }

    const { fileType, exec, compile, compileArgs } = languages[language];
    const className = language === 'java' ? code.match(/public class (\w+)/)[1] : 'temp';
    const fileName = `${className}.${fileType}`;
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
          console.log(compileError);
          return res.status(400).json({
            message: 'Compilation failed',
            error: (compileError instanceof Error ? compileError.toString() : 'Unknown error')
          });
        }
      }

      let execCommand;
      if (['c', 'cpp', 'go', 'rust'].includes(language)) {
        const exePath = path.join(tempDir, isWindows ? 'a.exe' : 'a');
        execCommand = `"${exePath}"`;
      } else if (language === 'java') {
        execCommand = `${exec} -cp "${tempDir}" ${className}`;
      } else if (language === 'typescript') {
        const jsFilePath = filePath.replace(/\.ts$/, '.js');
        execCommand = `${exec} "${jsFilePath}"`;
      } else {
        execCommand = `${exec} "${filePath}"`;
      }

      const output = await execPromise(execCommand, stdin); // Async call to execute code

      // Cleanup
      await unlink(filePath);
      if (['c', 'c++', 'go', 'rust'].includes(language)) {
        const exePath = path.join(tempDir, isWindows ? 'a.exe' : 'a');
        await unlink(exePath).catch(() => {});
      }

      if (language === 'java') {
        await unlink(path.join(tempDir, `${className}.class`)); // Remove the .class file
      }

      if (language === 'typescript') {
        const jsFilePath = filePath.replace(/\.ts$/, '.js');
        await unlink(jsFilePath).catch(() => {});
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