import * as fs from 'fs';
import path from 'path';
import { Arguments, Options } from 'yargs';
import { File } from '../../utils/file';
import YAML from 'yaml'
import jinja from "jinja-js";
import { ConfigManager } from "../../utils/config";
import { JsonnetTools } from "../../utils/jsonnet";


export const command: string = 'config';
export const desc: string = 'Get the current ddb configuration';
export const builder = {};
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const projectName = path.parse(process.cwd()).base;
  const data = ConfigManager.getConfiguration()

  const jsonnetFiles: string[] = File.findAllFilesRecursive(process.cwd(), '(.*)\\.jsonnet(.*)?');
  const jinjaFiles: string[] = File.findAllFilesRecursive(process.cwd(), '(.*)\\.jinja(.*)?');

  jsonnetFiles.forEach(async (file: string) => {
    const targetFilename = file.replace('.jsonnet', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    console.log(`[ddb] converting "${file.replace(process.cwd(), '')}" to "${targetFilename.replace(process.cwd(), '')}"`);

    const doc = new YAML.Document();
    doc.contents = await JsonnetTools.process(fileContent, data);
    fs.writeFileSync(targetFilename, doc.toString({ defaultStringType: 'QUOTE_SINGLE', defaultKeyType: 'PLAIN' }));
  });

  jinjaFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jinja', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    console.log(`[ddb] converting "${file.replace(process.cwd(), '')}" to "${targetFilename.replace(process.cwd(), '')}"`);

    const result = jinja.render(fileContent, data);
    fs.writeFileSync(targetFilename, result);
  });
};
