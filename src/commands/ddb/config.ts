import { Arguments, Options } from 'yargs';
import path from 'path';
import jinja from 'jinja-js';

import { File } from '../../utils/file';
import * as fs from 'fs';

export const command: string = 'config';
export const desc: string = 'Get the current ddb configuration';
export const builder = {};
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const projectName = path.parse(process.cwd()).base;

  const jsonnetFiles: string[] = File.findAllFiles(process.cwd(), '(.*).jsonnet(.*)?');
  const jinjaFiles: string[] = File.findAllFiles(process.cwd(), '(.*).jinja(.*)?');

  jsonnetFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jsonnet', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    console.log(`[ddb] ${projectName}: converting ${file.replace(process.cwd(), '')} to ${targetFilename.replace(process.cwd(), '')}`);
    console.log(fileContent);
    // TODO
  });

  jinjaFiles.forEach((file: string) => {
    const targetFilename = file.replace('.jinja', '');
    const fileContent = fs.readFileSync(file, 'utf8');

    console.log(`[ddb] ${projectName}: converting ${file.replace(process.cwd(), '')} to ${targetFilename.replace(process.cwd(), '')}`);

    // TODO Remplacer par des données chargées dynamiquement
    const data = {
      core: {
        domain: {
          sub: 'test',
          ext: 'com',
        },
      },
    };
    const result = jinja.render(fileContent, data);
    fs.writeFile(targetFilename, result, function (err) {
      if (err) {
        return console.error(err);
      }
    });
  });
};
