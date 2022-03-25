import path from 'path'
import * as fs from 'fs'

export namespace Docker {
  export function isDockerized (workdir: string): boolean {
    let dockerFolder = path.join(workdir, '.docker')
    let dockerCompose = path.join(workdir, 'docker-compose.yml')

    if (fs.existsSync(dockerFolder)) {
      return true
    }
    return fs.existsSync(dockerCompose);

  }
  export function isDdbized (workdir: string): boolean {
    let dockerComposeJsonnet = path.join(workdir, 'docker-compose.yml.jsonnet')
    return fs.existsSync(dockerComposeJsonnet);
  }
}

