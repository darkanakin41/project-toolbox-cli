import { ConfigManager } from './config';
import path from 'path';
import fs from 'fs';
import { Git } from './git';
import { File } from './file';
import { JavascriptTemplate } from './javascriptTemplate';
import { Logger } from './logger';
import { DockerComposeBinary } from '../model/DockerCompose';

export module BinaryManager {
  import getProjectRoot = ConfigManager.getProjectRoot;

  function getDirectory(): string {
    return path.join(getProjectRoot(), ConfigManager.getConfiguration().binary.directory);
  }

  function composeBuildBinary(binaryConfig: DockerComposeBinary): string {
    if (!binaryConfig.serviceName) {
      Logger.error('Service name missing on binary', true)
      return ''
    }

    // @ts-ignore
    const binaryParts = ['docker-compose'];

    if (binaryConfig.exec) {
      binaryParts.push('exec');
    } else {
      binaryParts.push('run', '--rm');
    }

    if (binaryConfig.workdir) {
      binaryParts.push('--workdir', process.cwd().replace(ConfigManager.getProjectRoot(), binaryConfig.workdir));
    }

    binaryParts.push(binaryConfig.serviceName, binaryConfig.command);

    return binaryParts.join(' ')
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

  export function retrieveBinary(name: string): string {
    const data = ConfigManager.getConfiguration()
    const jstFiles: string[] = File.findAllFilesRecursive(data.project.root, '(.*)\\.jst(.*)?');

    let binaries: { [key: string]: DockerComposeBinary } = {}
    jstFiles.forEach((file: string) => {
      const targetFilename = file.replace('.jst', '');
      const fileContent = fs.readFileSync(file, 'utf8');

      binaries = { ...binaries, ...JavascriptTemplate.getBinaries(fileContent, data) }
    });

    if (!binaries[name]) {
      Logger.error(`Unknown binary ${name}`)
      return '';
    }

    return composeBuildBinary(binaries[name])
  }
}
