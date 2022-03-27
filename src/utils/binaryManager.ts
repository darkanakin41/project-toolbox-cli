import { ConfigManager } from './config';
import path from 'path';
import fs from 'fs';
import { Git } from './git';

export module BinaryManager {
  import getProjectRoot = ConfigManager.getProjectRoot;

  function getDirectory(): string {
    return path.join(getProjectRoot(), ConfigManager.getConfiguration().binary.directory);
  }

  export function registerBinary(name: string, binary: string): void {
    const binaryDirectory = getDirectory();
    if (!fs.existsSync(binaryDirectory)) {
      fs.mkdirSync(binaryDirectory);
    }
    Git.addToGitignore(getProjectRoot(), '/' + ConfigManager.getConfiguration().binary.directory);

    const binaryPath = path.join(binaryDirectory, name);
    console.log(binaryDirectory, binaryPath);

    const fileElements = [];

    fileElements.push(binary);

    fs.writeFileSync(binaryPath, fileElements.join('\n'), { mode: 0o755 });
  }
}
