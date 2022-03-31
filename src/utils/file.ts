import * as fs from 'fs';
import path from 'path';
import { ConfigManager } from './config';
import { Logger } from './logger';

const excluded: (string | RegExp)[] = ['node_modules', 'vendor', 'var', 'bundles', /\.idea/, /\.github/, /\.git/, 'cache', '.vscode', /\.docker-data/];

export namespace File {
  function isExcludedPattern(toCheck: string, excludedPatterns: (string | RegExp)[]): boolean {
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

  export function findAllFiles(dir: string, pattern: string | RegExp): string[] {
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

  export function findAllFilesRecursive(dir: string, pattern: string | RegExp, excludedPatterns: string[] = []): string[] {
    Logger.debug(`Searching for files matching "${pattern} in ${dir} (recursive)`);
    const excludedFolders = [...excluded, ...ConfigManager.getConfiguration().files.ignoredFolders];
    const files: string[] = fs.readdirSync(dir);
    files.forEach((file, index) => {
      files[index] = path.join(dir, file);
    });

    const subfolders: string[] = [];
    files.forEach((file: string) => {
      const stat = fs.statSync(file);
      if (stat.isDirectory()) {
        if (!isExcludedPattern(file, excludedFolders)) {
          subfolders.push(file);
        }
      }
    });

    subfolders.forEach((subfolder: string) => {
      const subfiles = findAllFilesRecursive(subfolder, pattern);
      files.push(...subfiles);
    });

    const regex = new RegExp(pattern);
    return files.filter((file) => {
      const stat = fs.statSync(file);
      return !stat.isDirectory() && regex.test(path.basename(file)) && !isExcludedPattern(path.basename(file), excludedPatterns);
    });
  }
}
