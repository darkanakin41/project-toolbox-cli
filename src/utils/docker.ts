import path from 'path';
import * as fs from 'fs';

export namespace Docker {
  export function isDockerized(workdir: string): boolean {
    let dockerFolder = path.join(workdir, '.docker');
    let dockerCompose = path.join(workdir, 'docker-compose.yml');

    if (fs.existsSync(dockerFolder)) {
      return true;
    }
    return fs.existsSync(dockerCompose);
  }
}
