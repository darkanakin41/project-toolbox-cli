import { readFileSync } from 'fs';
import path from 'path';

export interface NpmPackage {
  name: string;
  version: string;
  type: NpmPackageType;
}

export type NpmPackageType = 'normal' | 'dev' | 'optional';

export class Npm {
  static processDependencies(dependencies: { [key: string]: string }[], workingDirectory: string, type: NpmPackageType): NpmPackage[] {
    const packages: NpmPackage[] = [];
    Object.keys(dependencies).forEach((dependency: string) => {
      // @ts-ignore
      const version = dependencies[dependency];
      packages.push({
        name: dependency,
        type: type,
        version: version,
      });
    });
    return packages;
  }

  static getPackages(workingDirectory: string) {
    const packageJsonContent = JSON.parse(readFileSync(path.join(workingDirectory, 'package.json')).toString());

    const packages: NpmPackage[] = [];

    if (packageJsonContent.dependencies) {
      packages.push(...this.processDependencies(packageJsonContent.dependencies, workingDirectory, 'normal'));
    }
    if (packageJsonContent.devDependencies) {
      packages.push(...this.processDependencies(packageJsonContent.devDependencies, workingDirectory, 'dev'));
    }
    if (packageJsonContent.optionalDependencies) {
      packages.push(...this.processDependencies(packageJsonContent.devDependencies, workingDirectory, 'optional'));
    }

    return packages;
  }
}
