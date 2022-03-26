import fs from 'fs';
import { File } from '../../utils/file';
import YAML from 'yaml';
import jinja from 'jinja-js';
import { ConfigManager } from '../../utils/config';
import { Git } from '../../utils/git';
import { JavascriptTemplate } from '../../utils/javascriptTemplate';

export const command: string = 'generate';
export const desc: string = 'Get the current ddb configuration';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();

  console.log(`[ddb] Environment set to "${data.env.current}"`);

  const jstFiles: string[] = File.findAllFilesRecursive(process.cwd(), '(.*)\\.jst(.*)?');
  const jinjaFiles: string[] = File.findAllFilesRecursive(process.cwd(), '(.*)\\.jinja(.*)?');

  jstFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jst', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    console.log(`[templates] converting "${file.replace(process.cwd(), '')}" to "${targetFilename.replace(process.cwd(), '')}"`);

    const doc = new YAML.Document();
    doc.contents = JavascriptTemplate.process(fileContent, data);
    fs.writeFileSync(targetFilename, doc.toString({ defaultStringType: 'QUOTE_SINGLE', defaultKeyType: 'PLAIN' }));
    Git.addToGitignore(process.cwd(), targetFilename.replace(process.cwd(), ''));
  });

  jinjaFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jinja', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    console.log(`[templates] converting "${file.replace(process.cwd(), '')}" to "${targetFilename.replace(process.cwd(), '')}"`);

    const result = jinja.render(fileContent, data);
    fs.writeFileSync(targetFilename, result);
    Git.addToGitignore(process.cwd(), targetFilename.replace(process.cwd(), ''));
  });

  const environmentFiles: string[] = File.findAllFilesRecursive(process.cwd(), `(.*)\.${data.env.current}\.?(.*)?`, ['(.*)\\.jsonnet(.*)?', '(.*)\\.jinja(.*)?']);
  environmentFiles.forEach((file: string) => {
    const targetFilename = file.replace(`.${data.env.current}`, '');
    console.log(`[templates] copying "${file.replace(process.cwd(), '')}" to "${targetFilename.replace(process.cwd(), '')}"`);
    fs.copyFileSync(file, targetFilename);

    Git.addToGitignore(process.cwd(), targetFilename.replace(process.cwd(), ''));
  });
};
