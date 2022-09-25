import * as fs from 'fs';
import path, { join } from 'path';
import { ConfigManager } from './config';
import { Logger } from './logger';

const excluded: (string | RegExp)[] = ['node_modules', 'vendor', 'var', 'bundles', /\.idea/, /\.github/, /\.git/, 'cache', '.vscode', /\.docker-data/];

export class File {
  private static isExcludedPattern(toCheck: string, excludedPatterns: (string | RegExp)[]): boolean {
    if (excludedPatterns.length === 0) {
      return false;
    }
    let isExcluded = false;
    excludedPatterns.forEach((pattern: string | RegExp) => {
      const regex = new RegExp(pattern);
      if (regex.test(toCheck)) {
        Logger.debug(`${toCheck}=> Excluded because of pattern ${pattern}`);
        isExcluded = true;
      }
    });
    return isExcluded;
  }

  static async dirSize(directory: string): Promise<number> {
    const files = fs.readdirSync(directory);

    const paths = files.map(async (file) => {
      const path = join(directory, file);
      const stat = fs.statSync(path);
      if (stat.isDirectory()) return await this.dirSize(path);

      if (stat.isFile()) {
        const { size } = fs.statSync(path);

        return size;
      }

      return 0;
    });

    return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
  }

  static sizeToHumanReadable(size: number, decimals = 2): string {
    if (size === 0) return '0  B';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(size) / Math.log(k));

    return parseFloat((size / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static findAllFiles(dir: string, pattern: string | RegExp): string[] {
    if (!fs.existsSync(dir)) {
      return [];
    }
    const files: string[] = fs.readdirSync(dir);
    files.forEach((file, index) => {
      if (!fs.existsSync(path.join(dir, file))) {
        return;
      }
      files[index] = path.join(dir, file);
    });

    const regex = new RegExp(pattern);
    return files.filter((file) => {
      if (!fs.existsSync(file)) {
        return;
      }
      const stat = fs.statSync(file);
      return !stat.isDirectory() && regex.test(file);
    });
  }

  static findAllFilesRecursive(dir: string, pattern: string | RegExp, excludedPatterns: string[] = []): string[] {
    Logger.debug(`Searching for files matching "${pattern} in ${dir} (recursive)`);
    const excludedFolders = [...excluded, ...ConfigManager.getConfiguration().files.ignoredFolders];
    try {
      const files: string[] = fs.readdirSync(dir);
      files.forEach((file, index) => {
        files[index] = path.join(dir, file);
      });

      const subfolders: string[] = [];
      files.forEach((file: string) => {
        const stat = fs.statSync(file);
        if (stat.isDirectory()) {
          if (!this.isExcludedPattern(file, excludedFolders)) {
            subfolders.push(file);
          }
        }
      });

      subfolders.forEach((subfolder: string) => {
        const subfiles = this.findAllFilesRecursive(subfolder, pattern);
        files.push(...subfiles);
      });

      const regex = new RegExp(pattern);
      return files.filter((file) => {
        const stat = fs.statSync(file);
        return !stat.isDirectory() && regex.test(path.basename(file)) && !this.isExcludedPattern(path.basename(file), excludedPatterns);
      });
    } catch (error) {
      return [];
    }
  }
}
