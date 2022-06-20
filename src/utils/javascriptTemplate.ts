import { existsSync, mkdirSync } from 'fs';
import yaml from 'js-yaml';
import { jsYamlConfiguration } from '../config/js-yaml';
import Configuration from '../model/Configuration';
import { DockerCompose, DockerComposeBinary, DockerComposeLabels, DockerComposeService, DockerComposeVirtualHost } from '../model/DockerCompose';
import { BinaryManager } from './binaryManager';
import { ObjectTools } from './object';
import { Git } from './git';
import { ConfigManager } from './config';
import path from 'path';

class JavascriptTemplateTools {
  private data: Configuration;
  private needsReverseProxy: boolean = false;
  private ports: number[] = [];

  constructor(data: Configuration) {
    this.data = data;
  }

  isEnv(env: string): boolean {
    return this.data.env.current === env;
  }

  getConfiguration(field: string): string | number | boolean | null {
    const dataFlattened = ObjectTools.flatten(this.data);
    return dataFlattened[field] ?? null;
  }

  getUID(): number {
    const user = this.data.docker.user;
    return user.uid;
  }

  getGID(): number {
    const user = this.data.docker.user;
    return user.gid;
  }

  prefixPort(port: string | number, outputPort: string | null = null): string {
    if (outputPort) {
      this.ports.push(parseInt(outputPort));
      return `${outputPort}:${port}`;
    }
    const portPrefix = this.data.docker.port_prefix;
    let exposedPort: number = parseInt(`${portPrefix}${port.toString().substring(port.toString().length - 2)}`);
    while (this.ports.includes(exposedPort)) {
      exposedPort++;
    }
    this.ports.push(exposedPort);
    return `${exposedPort}:${port}`;
  }

  buildDomain(subdomain: string | null = null): string {
    const domain = `${this.data.reverseProxy.domain.sub}.${this.data.reverseProxy.domain.ext}`;
    if (subdomain) {
      return `${subdomain}.${domain}`;
    }
    return domain;
  }

  buildPrivateDomain(subdomain: string | null = null): string {
    const domain = `${this.data.reverseProxy.privateDomain.sub}.${this.data.reverseProxy.privateDomain.ext}`;
    if (subdomain) {
      return `${subdomain}.${domain}`;
    }
    return domain;
  }

  compose(composeConfiguration: DockerCompose): DockerCompose {
    composeConfiguration.version = this.data.compose.version;

    Object.keys(composeConfiguration.services).forEach((serviceName) => {
      const service = composeConfiguration.services[serviceName];
      this.composeAddRestart(service);
      this.composeAddInit(service);
      this.composeHandleBinaries(serviceName, service);
      this.composeHandleBuildImage(service);
      this.composeHandleUser(service);
      this.composeHandleVirtualHost(service);
    });

    this.composeHandleNetworks(composeConfiguration);
    this.composeHandleVolumes(composeConfiguration);

    return composeConfiguration;
  }

  getBinaries(composeConfiguration: DockerCompose): { [key: string]: DockerComposeBinary } {
    let binaries = {};

    Object.keys(composeConfiguration.services).forEach((serviceName) => {
      const service = composeConfiguration.services[serviceName];
      binaries = { ...binaries, ...this.composeGetBinaries(serviceName, service) };
    });

    return binaries;
  }

  composeAddRestart(service: DockerComposeService): void {
    if (service.restart) {
      return;
    }

    service.restart = this.data.docker.restart;
  }

  composeAddInit(service: DockerComposeService): void {
    if (service.init) {
      return;
    }

    service.init = this.data.docker.init;
  }

  composeHandleUser(service: DockerComposeService): any {
    if (!service.applyUser) {
      return;
    }

    const user = this.data.docker.user;
    service.user = `${user.uid}:${user.gid}`;

    delete service['applyUser'];
  }

  composeHandleBuildImage(service: DockerComposeService): void {
    if (!service.buildImage) {
      return;
    }

    if (this.data.docker.build.baseDirectory !== '.') {
      service.build = {
        context: `${this.data.docker.build.baseDirectory}/${service.buildImage}`,
      };
    } else {
      service.build = {
        context: `.`,
      };
    }

    delete service['buildImage'];
  }

  composeHandleBinaries(serviceName: string, service: DockerComposeService): void {
    if (!service.binaries) {
      return;
    }

    Object.keys(service.binaries).forEach((binaryName: string) => {
      const binaryParts = [`$(pt binary get ${binaryName})`, '"$@"'];
      BinaryManager.registerBinary(binaryName, binaryParts.join(' '));
    });

    delete service['binaries'];
  }

  composeGetBinaries(serviceName: string, service: DockerComposeService): { [key: string]: DockerComposeBinary } {
    if (!service.binaries) {
      return {};
    }
    Object.keys(service.binaries).forEach((binaryName: string) => {
      // @ts-ignore
      const config: DockerComposeBinary = service.binaries[binaryName];
      config.serviceName = serviceName;
    });
    return service.binaries;
  }

  composeHandleNetworks(composeConfiguration: DockerCompose): void {
    if (!composeConfiguration.networks) {
      composeConfiguration.networks = {};
    }

    if (this.data.reverseProxy.enabled && this.needsReverseProxy) {
      composeConfiguration.networks[this.data.reverseProxy.network] = {
        external: true,
        name: this.data.reverseProxy.network,
      };
    }
  }

  composeHandleVolumes(composeConfiguration: DockerCompose): void {
    if (!composeConfiguration.volumes) {
      composeConfiguration.volumes = {};
    }

    const volumes = composeConfiguration.volumes;

    Object.keys(composeConfiguration.services).forEach((serviceName: string) => {
      const serviceConfiguration: DockerComposeService = composeConfiguration.services[serviceName];
      if (!serviceConfiguration.volumes) {
        return;
      }
      serviceConfiguration.volumes.forEach((volume: string) => {
        const localPart: string = volume.split(':')[0];
        if (localPart.indexOf('/') !== 0 && localPart.indexOf('./') !== 0) {
          volumes[localPart] = {};
        } else if (localPart.indexOf('./') === 0) {
          this._handleLocalVolume(localPart);
        }
      });
    });
    composeConfiguration.volumes = volumes;
  }

  _handleLocalVolume(volumePath: string): void {
    const fullPath = path.join(ConfigManager.getProjectRoot(), volumePath);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
    if (!Git.isFileIgnored(ConfigManager.getProjectRoot(), volumePath)) {
      Git.addToGitignore(ConfigManager.getProjectRoot(), volumePath);
    }
  }

  composeHandleVirtualHost(service: DockerComposeService): void {
    if (!service.virtualHosts) {
      return;
    }

    if (!this.data.reverseProxy.enabled) {
      this.composeHandleNoReverseProxy(service);
      delete service['virtualHosts'];
      return;
    }

    switch (this.data.reverseProxy.type) {
      case 'traefik':
        this.composeHandleTraefikVirtualHost(service);
        break;
    }
    service.networks = ['default', this.data.reverseProxy.network];

    delete service['virtualHosts'];
  }

  composeHandleTraefikVirtualHost(service: DockerComposeService): void {
    if (!service.virtualHosts) {
      return;
    }
    this.needsReverseProxy = true;
    let labels: DockerComposeLabels = service.labels ?? {
      'traefik.enable': true,
    };

    // @ts-ignore
    const projectNameFormated = this.data.project.name.replace(/[^a-zA-Z0-9]/g, '-');

    service.virtualHosts.forEach((virtualHost: DockerComposeVirtualHost | null) => {
      if (virtualHost === null) {
        return;
      }
      const serviceName = `${projectNameFormated}-${virtualHost.name}`;
      switch (virtualHost.type) {
        default:
        case 'http':
          this.composeHandleTraefikVirtualHostHttp(serviceName, labels, virtualHost);
          break;
      }
    });

    service.labels = labels;
  }

  composeHandleNoReverseProxy(service: DockerComposeService): void {
    if (!service.virtualHosts) {
      return;
    }
    service.ports = [];

    service.virtualHosts.forEach((virtualHost: DockerComposeVirtualHost | null) => {
      if (!virtualHost) {
        return;
      }
      if (!service.ports) {
        service.ports = [];
      }
      service.ports.push(this.prefixPort(virtualHost.port ?? 0));
    });
  }

  composeHandleTraefikVirtualHostHttp(serviceName: string, labels: DockerComposeLabels, virtualHost: DockerComposeVirtualHost): void {
    const redirectToHttps = this.data.reverseProxy.redirectToHttps ?? false;
    const tls = this.data.reverseProxy.tls ?? false;
    const certResolver = this.data.reverseProxy.certResolver ?? null;

    const httpMiddlewares: string[] = [];
    const httpsMiddlewares: string[] = [];

    labels[`traefik.http.routers.${serviceName}.entrypoints`] = `http`;
    if (virtualHost.host) {
      labels[`traefik.http.routers.${serviceName}.rule`] = `Host(${virtualHost.host})`;
    } else if (virtualHost.domain) {
      labels[`traefik.http.routers.${serviceName}.rule`] = `Host(\`${virtualHost.domain}\`)`;
    }
    if (virtualHost.service) {
      labels[`traefik.http.routers.${serviceName}.service`] = virtualHost.service;
    } else {
      labels[`traefik.http.routers.${serviceName}.service`] = serviceName;
    }
    if (virtualHost.port) {
      labels[`traefik.http.services.${serviceName}.loadbalancer.server.port`] = `${virtualHost.port}`;
    }
    if (redirectToHttps) {
      const redirectToHttpsMiddleware = `${serviceName}-redirect-to-https`;
      labels[`traefik.http.middlewares.${redirectToHttpsMiddleware}.redirectscheme.scheme`] = 'https';
      httpMiddlewares.push(redirectToHttpsMiddleware);
    }
    if (virtualHost.prefix) {
      const prefixMiddleware = `${serviceName}-prefix`;
      labels[`traefik.http.middlewares.${prefixMiddleware}.addprefix.prefix`] = virtualHost.prefix;
      httpMiddlewares.push(prefixMiddleware);
      httpsMiddlewares.push(prefixMiddleware);
    }
    if (httpMiddlewares.length > 0) {
      labels[`traefik.http.routers.${serviceName}.middlewares`] = httpMiddlewares.join(', ');
    }
    if (tls) {
      labels[`traefik.http.routers.${serviceName}-tls.tls`] = 'true';
      labels[`traefik.http.routers.${serviceName}-tls.entrypoints`] = `https`;
      if (certResolver) {
        labels[`traefik.http.routers.${serviceName}-tls.tls.certresolver`] = certResolver;
      }
      if (virtualHost.host) {
        labels[`traefik.http.routers.${serviceName}-tls.rule`] = `Host(${virtualHost.host})`;
      } else if (virtualHost.domain) {
        labels[`traefik.http.routers.${serviceName}-tls.rule`] = `Host(\`${virtualHost.domain}\`)`;
      }
      labels[`traefik.http.routers.${serviceName}-tls.service`] = serviceName;
      if (httpsMiddlewares.length > 0) {
        labels[`traefik.http.routers.${serviceName}-tls.middlewares`] = httpsMiddlewares.join(', ');
      }
    }
  }
}
export module JavascriptTemplate {
  export function process(template: string, data: Configuration): string {
    // noinspection JSUnusedLocalSymbols
    const JST = new JavascriptTemplateTools(data);
    const result = eval(template);
    return yaml.dump(JST.compose(result), jsYamlConfiguration);
  }

  export function getBinaries(template: string, data: Configuration): { [key: string]: DockerComposeBinary } {
    // noinspection JSUnusedLocalSymbols
    const JST = new JavascriptTemplateTools(data);
    const result: DockerCompose = eval(template);

    return JST.getBinaries(result);
  }
}
