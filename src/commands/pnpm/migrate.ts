import { execSync } from 'child_process';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'fs';
import path from 'path';
import { Logger } from '../../utils/logger';

export const command = 'migrate';
export const desc = 'Migrate from npm or yarn';
export const builder = {};
export const handler = async (): Promise<void> => {
  if (!existsSync(path.join(process.cwd(), 'package-lock.json')) && !existsSync(path.join(process.cwd(), 'yarn.lock'))) {
    Logger.warn('No NPM/YARN lock file, nothing to do here');
    return;
  }

  Logger.info('Removing node_modules');
  if (existsSync(path.join(process.cwd(), 'node_modules'))) {
    rmSync(path.join(process.cwd(), 'node_modules'), { recursive: true, force: true });
  }

  Logger.info('Removing previous pnpm installation');
  if (existsSync(path.join(process.cwd(), 'pnpm-lock.yaml'))) {
    rmSync(path.join(process.cwd(), 'pnpm-lock.yaml'), { force: true });
  }

  Logger.info('Executing pnpm import');
  execSync('pnpm import');

  Logger.info('Upgrading package.json');
  const replaceRegex = /\bnpm\b/gi;
  let packageJsonContent = readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
  packageJsonContent = packageJsonContent.replace(replaceRegex, 'pnpm');
  writeFileSync(path.join(process.cwd(), 'package.json'), packageJsonContent);

  Logger.info('Removing yarn.lock');
  if (existsSync(path.join(process.cwd(), 'yarn.lock'))) {
    rmSync(path.join(process.cwd(), 'yarn.lock'), { force: true });
  }
  Logger.info('Removing package-lock.json');
  if (existsSync(path.join(process.cwd(), 'package-lock.json'))) {
    rmSync(path.join(process.cwd(), 'package-lock.json'), { force: true });
  }

  Logger.info('Executing pnpm i');
  execSync('pnpm i');

  Logger.success('NPM/YARN to PNPM migration DONE');
};
