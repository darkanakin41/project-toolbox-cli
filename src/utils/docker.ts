import path from 'path';
import fs from 'fs';

export namespace Docker {
  export function isDockerized(workdir: string): boolean {
    let dockerFolder = path.join(workdir, '.docker');
    let dockerCompose = path.join(workdir, 'docker-compose.yml');

    if (fs.existsSync(dockerFolder)) {
      return true;
    }
    return fs.existsSync(dockerCompose);
  }

  export function applyFixuid(workdir: string): void {
    const dockerFile = path.join(workdir, 'Dockerfile');
    
    if (!fs.existsSync(dockerFile)) {
      return;
    }

    const dockerFileContent = fs.readFileSync(dockerFile, 'utf8');

    const dockerFileContentArray = dockerFileContent.split('\n');
    let entrypointIndex = dockerFileContentArray.findIndex(line => line.startsWith('ENTRYPOINT'));

    if (entrypointIndex === -1) {
      return
    }

    dockerFileContentArray.splice(entrypointIndex, 0, 'RUN curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.5.1/fixuid-0.5.1-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - \\');
    dockerFileContentArray.splice(entrypointIndex + 1, 0, '	&& chown root:root /usr/local/bin/fixuid \\');
    dockerFileContentArray.splice(entrypointIndex + 2, 0, '	&& chmod u+s /usr/local/bin/fixuid \\');
    dockerFileContentArray.splice(entrypointIndex + 3, 0, '	&& mkdir -p /etc/fixuid');
    dockerFileContentArray.splice(entrypointIndex + 4, 0, 'COPY fixuid.yml /etc/fixuid/config.yml');
    dockerFileContentArray.splice(entrypointIndex + 5, 0, '');

    entrypointIndex = dockerFileContentArray.findIndex(line => line.startsWith('ENTRYPOINT'));
    const entryPointText = dockerFileContentArray[entrypointIndex].replace('ENTRYPOINT [', '').replace(']', '');

    dockerFileContentArray[entrypointIndex] = `ENTRYPOINT ["fixuid", "-q", ${entryPointText}]`;

    fs.writeFileSync(dockerFile, dockerFileContentArray.join('\n'));
  }
}
