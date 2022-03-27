import * as fs from 'fs';
import path from 'path';
import { ConfigManager } from './config';
import { Logger } from './logger';

const excluded = ['node_modules', 'vendor', 'var', 'bundles', '.idea', '.github', '.git', 'cache', '.vscode'];

export namespace File {
  function isExcludedPattern(toCheck: string, excludedPatterns: string[]): boolean {
    if (excludedPatterns.length === 0) {
      return false;
    }
    let isExcluded = false;
    excludedPatterns.forEach((pattern: string) => {
      const regex = new RegExp(pattern);
      if (regex.test(toCheck)) {
        isExcluded = true;
      }
    });
    return isExcluded;
  }

  export function findAllFiles(dir: string, pattern: string): string[] {
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

  export function findAllFilesRecursive(dir: string, pattern: string, excludedPatterns: string[] = []): string[] {
    Logger.debug(`Searching for files matching "${pattern} in ${dir}`);
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
