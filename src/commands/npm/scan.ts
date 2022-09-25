import { execSync } from 'child_process';
import path from 'path';
import { SemVer } from 'semver';
import { Options } from 'simple-git';
import { table, TableUserConfig } from 'table';
import { Arguments, CommandBuilder } from 'yargs';
import { File } from '../../utils/file';
import { Logger } from '../../utils/logger';
import { Npm, NpmPackage } from '../../utils/Npm';

interface Package {
  name: string;
  minVersion: string;
  maxVersion: string;
  usedIn: string[];
}

export const command = 'scan';
export const desc = 'Scan package.json to retrieve all dependencies and versions';
export const builder: CommandBuilder<Options, Options> = (yargs) => {
  return yargs.positional('onlyUnificationNeeded', { type: 'boolean', required: false }).positional('apply', { type: 'boolean', required: false }).positional('updateProject', { type: 'string', required: false });
};
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  let files = File.findAllFilesRecursive(process.cwd(), 'package.json');
  const tableData: string[][] = [['Package', 'Min Version', 'Max Version', 'Used In', 'Need unification ?', 'command']];
  const tableConfig: TableUserConfig = {
    columns: [{ alignment: 'left' }, { alignment: 'center' }, { alignment: 'center' }, { alignment: 'left' }],
  };

  const packages: Package[] = [];

  function getPackage(name: string): Package {
    let thePackage = packages.find((p) => p.name === name);
    if (!thePackage) {
      thePackage = {
        name: name,
        minVersion: '^999.999.999',
        maxVersion: '^0.0.0',
        usedIn: [],
      };
      packages.push(thePackage);
    }
    return thePackage;
  }

  function processDependencies(packages: NpmPackage[], workingDirectory: string): void {
    packages.forEach((dependency: NpmPackage) => {
      const p = getPackage(dependency.name);
      const semver = new SemVer(dependency.version.replace('^', ''));
      if (semver.compare(p.minVersion.replace('^', '')) === -1) {
        p.minVersion = dependency.version;
      }
      if (semver.compare(p.maxVersion.replace('^', '')) === 1) {
        p.maxVersion = dependency.version;
      }
      p.usedIn.push(workingDirectory.replace(process.cwd(), ''));
    });
  }

  files = files.sort((a, b) => a.localeCompare(b));
  files.forEach((file) => {
    const workingDirectory = path.dirname(file);
    const packages = Npm.getPackages(workingDirectory);
    processDependencies(packages, workingDirectory);
  });

  if (argv.updateProject && typeof argv.updateProject === 'string') {
    const currentFile = files.find((f) => f.includes(argv.updateProject?.toString() ?? ''));
    if (!currentFile) {
      return;
    }
    const workingDirectory = path.dirname(currentFile);
    const projectNpmPackages = Npm.getPackages(workingDirectory);

    const toUpdate = packages.filter((p) => {
      const existing = projectNpmPackages.find((p2) => p2.name === p.name);
      if (!existing) {
        return false;
      }
      const semver = new SemVer(existing.version.replace('^', ''));
      return p.usedIn.join(',').includes(argv.updateProject?.toString() ?? '') && p.minVersion !== p.maxVersion && semver.compare(p.maxVersion.replace('^', '')) === -1;
    });

    if (toUpdate.length === 0) {
      return Logger.success('Everything is fine, nothing to do here');
    }
    const command = `cd "${workingDirectory.replace(process.cwd() + '\\', '')}" && pnpm update ${toUpdate
      .map((p) => {
        const semver = new SemVer(p.maxVersion.replace('^', ''));
        return `${p.name}@^${semver.toString()}`;
      })
      .join(' ')}`;

    if (argv.apply) {
      try {
        execSync(command);
        Logger.success('Project updated !');
      } catch (e) {
        console.log(e);
      }
      return;
    }
    Logger.info(command);
    return;
  }

  packages
    .sort((p1, p2) => p1.name.localeCompare(p2.name))
    .forEach((p) => {
      if (!argv.onlyUnificationNeeded) {
        tableData.push([p.name, p.minVersion, p.maxVersion, p.usedIn.join('\n'), p.minVersion !== p.maxVersion ? 'YES' : 'NO', `npm update ${p.name}@${p.maxVersion}`]);
        return;
      }
      if (p.minVersion !== p.maxVersion) {
        tableData.push([p.name, p.minVersion, p.maxVersion, p.usedIn.join('\n'), p.minVersion !== p.maxVersion ? 'YES' : 'NO', `npm update ${p.name}@${p.maxVersion}`]);
      }
    });

  console.log(table(tableData, tableConfig));
};
