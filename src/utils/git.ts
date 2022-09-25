import fs from 'fs';
import path from 'path';
import simpleGit from 'simple-git';
import { Logger } from './logger';

export class Git {
  static toReplace: { [key: string]: string } = {
    '.git': '',
    'git@github.com:': 'https://github.com/',
    '\n': '',
    '\r': '',
    '\t': '',
  };

  private static cleanFileName(file: string): string {
    file = file.replace(/\\/g, '/');
    file = file.replace(/\[/g, '\\[');
    file = file.replace(/]/g, '\\]');
    file = file.replace(/^.\//gm, '/');
    return file;
  }

  static getRemoteType(remote: string): string | null {
    if (remote.indexOf('github.com') > -1) {
      return 'github';
    }
    return null;
  }

  static async getCurrentBranch(workdir: string): Promise<string> {
    const git = simpleGit(workdir);

    const branches = await git.branch();

    return branches.current;
  }

  static async getPublicUrl(workdir: string): Promise<string> {
    const git = simpleGit(workdir);

    let urls = await git.listRemote(['--get-url']);

    if (Array.isArray(urls)) {
      const urlsFormatted = urls.map((url) => {
        Object.keys(this.toReplace).forEach((key) => {
          url = url.replace(key, this.toReplace[key]);
        });
        return url;
      });

      return urlsFormatted[0];
    }

    Object.keys(this.toReplace).forEach((key) => {
      urls = urls.replace(key, this.toReplace[key]);
    });

    return urls;
  }

  static async getPullRequestCreateUrl(workdir: string): Promise<string | null> {
    const baseUrl = await this.getPublicUrl(workdir);

    const source = await this.getCurrentBranch(workdir);

    let target = 'dev';
    if (source === 'dev') {
      target = 'main';
    }

    switch (this.getRemoteType(baseUrl)) {
      case 'github':
        return `${baseUrl}/compare/${target}...${source}`;
      default:
        return null;
    }
  }

  static async getPullRequestListUrl(workdir: string): Promise<string | null> {
    const baseUrl = await this.getPublicUrl(workdir);

    switch (this.getRemoteType(baseUrl)) {
      case 'github':
        return `${baseUrl}/pulls`;
      default:
        return null;
    }
  }

  static isFileIgnored(workdir: string, file: string): boolean {
    if (!fs.existsSync(path.join(workdir, '.gitignore'))) {
      fs.writeFileSync(path.join(workdir, '.gitignore'), '');
      Logger.info('[gitignore] Created .gitignore file');
    }
    file = this.cleanFileName(file);
    const fileContent = fs.readFileSync(path.join(workdir, '.gitignore'), 'utf8');
    return fileContent.split('\n').indexOf(file) !== -1;
  }

  static addToGitignore(workdir: string, file: string): void {
    file = this.cleanFileName(file);
    if (this.isFileIgnored(workdir, file)) {
      return;
    }
    const fileContent = fs.readFileSync(path.join(workdir, '.gitignore'), 'utf8');
    const rows = fileContent.split('\n');
    rows.push(file);
    fs.writeFileSync(path.join(workdir, '.gitignore'), rows.join('\n'));

    Logger.success(`[gitignore] Added ${file} to .gitignore`);
  }
}
