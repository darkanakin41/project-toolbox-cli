import fs from 'fs';
import { File } from '../../utils/file';
import jinja from 'jinja-js';
import { ConfigManager } from '../../utils/config';
import { Git } from '../../utils/git';
import { JavascriptTemplate } from '../../utils/javascriptTemplate';
import { Logger } from '../../utils/logger';

export const command: string = 'generate';
export const desc: string = 'Get the current ddb configuration';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();

  Logger.info(`[ddb] Environment set to "${data.env.current}"`);

  const jstFiles: string[] = File.findAllFilesRecursive(data.project.root, /(.*)\.jst(.*)?/);
  const jinjaFiles: string[] = File.findAllFilesRecursive(data.project.root, /(.*)\.jinja(.*)?/);

  jstFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jst', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    fs.writeFileSync(targetFilename, JavascriptTemplate.process(fileContent, data));
    Git.addToGitignore(data.project.root, targetFilename.replace(data.project.root, ''));

    Logger.success(`[templates] converted "${file.replace(data.project.root, '')}" to "${targetFilename.replace(data.project.root, '')}"`);
  });

  jinjaFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jinja', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    const result = jinja.render(fileContent, data);
    fs.writeFileSync(targetFilename, result);
    Git.addToGitignore(data.project.root, targetFilename.replace(data.project.root, ''));

    Logger.success(`[templates] converted "${file.replace(data.project.root, '')}" to "${targetFilename.replace(data.project.root, '')}"`);
  });

  const environmentFiles: string[] = File.findAllFilesRecursive(data.project.root, new RegExp(`(.*)\\.${data.env.current}\\.?(.*)?`), ['(.*)\\.jsonnet(.*)?', '(.*)\\.jinja(.*)?']);
  environmentFiles.forEach((file: string) => {
    const targetFilename = file.replace(`.${data.env.current}`, '');

    fs.copyFileSync(file, targetFilename);
    console.log(targetFilename.replace(data.project.root, '').replace(/\\/g, '/'));
    Git.addToGitignore(data.project.root, targetFilename.replace(data.project.root, ''));

    Logger.success(`[templates] copied "${file.replace(data.project.root, '')}" to "${targetFilename.replace(data.project.root, '')}"`);
  });

  Git.addToGitignore(data.project.root, '/pt.local.yaml');
};
