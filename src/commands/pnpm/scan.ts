import { existsSync } from 'fs';
import path from 'path';
import { File } from '../../utils/file';
import { table, TableUserConfig } from 'table';

export const command = 'scan';
export const desc = 'Scan node project in current folder';
export const builder = {};
export const handler = async (): Promise<void> => {
  let files = File.findAllFilesRecursive(process.cwd(), 'package.json');
  const tableData: string[][] = [['Path', 'Using PNPM ?']];
  const tableConfig: TableUserConfig = {
    columns: [{ alignment: 'left' }, { alignment: 'center' }],
  };
  files = files.sort((a, b) => a.localeCompare(b));

  for (const index in files) {
    const file = files[index];
    const workingDirectory = path.dirname(file);

    if (!existsSync(path.join(workingDirectory, 'package-lock.json')) && !existsSync(path.join(workingDirectory, 'yarn.lock')) && existsSync(path.join(workingDirectory, 'pnpm-workspace.yaml'))) {
      tableData.push([workingDirectory.replace(process.cwd(), ''), 'YES']);
    } else {
      tableData.push([workingDirectory.replace(process.cwd(), ''), 'NO']);
    }
  }

  console.log(table(tableData, tableConfig));
};
