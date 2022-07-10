import simpleGit from 'simple-git';
import fs from 'fs';
import path from 'path';
import { Logger } from './logger';

export namespace Git {
  const toReplace: { [key: string]: string } = {
    '.git': '',
    'git@github.com:': 'https://github.com/',
    '\n': '',
    '\r': '',
    '\t': '',
  };

  function cleanFileName(file: string): string {
    file = file.replace(/\\/g, '/');
    file = file.replace(/\[/g, '\\[');
    file = file.replace(/]/g, '\\]');
    file = file.replace(/^.\//gm, '\/');
    return file;
  }

  export const getRemoteType = (remote: string): string | null => {
    if (remote.indexOf('github.com') > -1) {
      return 'github';
    }
    return null;
  };

  export const getCurrentBranch = async (workdir: string): Promise<string> => {
    const git = simpleGit(workdir);

    const branches = await git.branch();

    return branches.current;
  };

  export const getPublicUrl = async (workdir: string): Promise<string> => {
    const git = simpleGit(workdir);

    let urls = await git.listRemote(['--get-url']);

    if (Array.isArray(urls)) {
      const urlsFormatted = urls.map((url) => {
        Object.keys(toReplace).forEach((key) => {
          url = url.replace(key, toReplace[key]);
        });
        return url;
      });

      return urlsFormatted[0];
    }

    Object.keys(toReplace).forEach((key) => {
      urls = urls.replace(key, toReplace[key]);
    });

    return urls;
  };

  export const getPullRequestCreateUrl = async (workdir: string): Promise<string | null> => {
    const baseUrl = await getPublicUrl(workdir);

    const source = await getCurrentBranch(workdir);

    let target = 'dev';
    if (source === 'dev') {
      target = 'main';
    }

    switch (getRemoteType(baseUrl)) {
      case 'github':
        return `${baseUrl}/compare/${target}...${source}`;
      default:
        return null;
    }
  };

  export const getPullRequestListUrl = async (workdir: string): Promise<string | null> => {
    const baseUrl = await getPublicUrl(workdir);

    switch (getRemoteType(baseUrl)) {
      case 'github':
        return `${baseUrl}/pulls`;
      default:
        return null;
    }
  };

  export const isFileIgnored = (workdir: string, file: string): boolean => {
    if (!fs.existsSync(path.join(workdir, '.gitignore'))) {
      fs.writeFileSync(path.join(workdir, '.gitignore'), '');
      Logger.info('[gitignore] Created .gitignore file');
    }
    file = cleanFileName(file);
    const fileContent = fs.readFileSync(path.join(workdir, '.gitignore'), 'utf8');
    return fileContent.split('\n').indexOf(file) !== -1;
  };

  export const addToGitignore = (workdir: string, file: string): void => {
    file = cleanFileName(file);
    if(file.indexOf('.') === 0){
    }
    if (isFileIgnored(workdir, file)) {
      return;
    }
    const fileContent = fs.readFileSync(path.join(workdir, '.gitignore'), 'utf8');
    const rows = fileContent.split('\n');
    rows.push(file);
    fs.writeFileSync(path.join(workdir, '.gitignore'), rows.join('\n'));

    Logger.success(`[gitignore] Added ${file} to .gitignore`);
  };
}
