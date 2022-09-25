import fs from 'fs';
import { Docker } from 'node-docker-api';
import path from 'path';
import { Logger } from './logger';
import { NumberUtils } from './NumberUtils';

export class DockerUtils {
  static instance: Docker | undefined;
  private static getInstance(): Docker {
    if (!this.instance) {
      this.instance = new Docker({ socketPath: '/var/run/docker.sock' });
    }
    return this.instance;
  }
  static isDockerized(workdir: string): boolean {
    const dockerFolder = path.join(workdir, '.docker');
    const dockerCompose = path.join(workdir, 'docker-compose.yml');

    if (fs.existsSync(dockerFolder)) {
      return true;
    }
    return fs.existsSync(dockerCompose);
  }

  static applyFixuid(workdir: string): void {
    const dockerFile = path.join(workdir, 'Dockerfile');

    if (!fs.existsSync(dockerFile)) {
      return;
    }

    const dockerFileContent = fs.readFileSync(dockerFile, 'utf8');

    const dockerFileContentArray = dockerFileContent.split('\n');
    let entrypointIndex = dockerFileContentArray.findIndex((line) => line.startsWith('ENTRYPOINT'));

    if (entrypointIndex === -1) {
      return;
    }

    dockerFileContentArray.splice(entrypointIndex, 0, 'RUN curl -SsL https://github.com/boxboat/fixuid/releases/download/v0.5.1/fixuid-0.5.1-linux-amd64.tar.gz | tar -C /usr/local/bin -xzf - \\');
    dockerFileContentArray.splice(entrypointIndex + 1, 0, '	&& chown root:root /usr/local/bin/fixuid \\');
    dockerFileContentArray.splice(entrypointIndex + 2, 0, '	&& chmod u+s /usr/local/bin/fixuid \\');
    dockerFileContentArray.splice(entrypointIndex + 3, 0, '	&& mkdir -p /etc/fixuid');
    dockerFileContentArray.splice(entrypointIndex + 4, 0, 'COPY fixuid.yml /etc/fixuid/config.yml');
    dockerFileContentArray.splice(entrypointIndex + 5, 0, '');

    entrypointIndex = dockerFileContentArray.findIndex((line) => line.startsWith('ENTRYPOINT'));
    const entryPointText = dockerFileContentArray[entrypointIndex].replace('ENTRYPOINT [', '').replace(']', '');

    dockerFileContentArray[entrypointIndex] = `ENTRYPOINT ["fixuid", "-q", ${entryPointText}]`;

    fs.writeFileSync(dockerFile, dockerFileContentArray.join('\n'));
  }

  static async listAllContainers(): Promise<void> {
    console.log((await this.getInstance().container.list())[0]);
  }

  static async cleanup(): Promise<void> {
    const imagesResult = await this.getInstance().image.prune({ dangling: true });
    if (typeof imagesResult === 'object') {
      // @ts-ignore
      Logger.success(`[docker] cleanup: removed ${(imagesResult.ImagesDeleted ?? []).length} images, retrieved ${NumberUtils.getReadableSizeString(imagesResult.SpaceReclaimed)}`);
    }

    const volumesResult = await this.getInstance().volume.prune({ dangling: true });
    if (typeof volumesResult === 'object') {
      // @ts-ignore
      Logger.success(`[docker] cleanup: removed ${(volumesResult.VolumesDeleted ?? []).length} volumes, retrieved ${NumberUtils.getReadableSizeString(volumesResult.SpaceReclaimed)}`);
    }
  }
}
