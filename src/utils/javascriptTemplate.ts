import yaml from 'js-yaml';
import { jsYamlConfiguration } from '../config/js-yaml';
import Configuration from '../model/Configuration';
import { DockerCompose, DockerComposeBinary, DockerComposeService, DockerComposeVirtualHost } from '../model/DockerCompose';
import { BinaryManager } from './binaryManager';

class JavascriptTemplateTools {
  private data: Configuration;
  private needsReverseProxy: boolean = false;

  constructor(data: Configuration) {
    this.data = data;
  }

  isEnv(env: string): boolean {
    return this.data.env.current === env;
  }

  prefixPort(port: string | number, outputPort: string | null = null): string {
    if (outputPort) {
      return `${outputPort}:${port}`;
    }
    const portPrefix = this.data.docker.port_prefix;
    return `${portPrefix}${port.toString().substring(port.toString().length - 2)}:${port}`;
  }

  buildDomain(subdomain: string | null = null): string {
    const domain = `${this.data.reverseProxy.domain.sub}.${this.data.reverseProxy.domain.ext}`;
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

    if(this.data.docker.build.baseDirectory !== '.'){
      service.build = {
        context: `${this.data.docker.build.baseDirectory}/${service.buildImage}`,
      };
    }else{
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

  composeHandleVirtualHost(service: DockerComposeService): void {
    if (!service.virtualHosts) {
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
    this.needsReverseProxy = true
    let labels: { [key: string]: string | number | boolean } = service.labels ?? {
      'traefik.enable': true,
    };

    // @ts-ignore
    const projectNameFormated = this.data.project.name.replace(/[^a-zA-Z0-9]/g, '-');

    const redirectToHttps = this.data.reverseProxy.redirectToHttps ?? false;
    const tls = this.data.reverseProxy.tls ?? false;
    const certResolver = this.data.reverseProxy.certResolver ?? null;

    service.virtualHosts.forEach((virtualHost: DockerComposeVirtualHost | null) => {
      if (virtualHost === null) {
        return;
      }
      const serviceName = `${projectNameFormated}-${virtualHost.name}`;
      labels[`traefik.http.routers.${serviceName}.rule`] = `Host(\`${virtualHost.domain}\`)`;
      labels[`traefik.http.routers.${serviceName}.service`] = serviceName;
      labels[`traefik.http.services.${serviceName}.loadbalancer.server.port`] = `${virtualHost.port}`;
      if (redirectToHttps) {
        const middlewareName = `${serviceName}-redirect-to-https`;
        labels[`traefik.http.middlewares.${middlewareName}.redirectscheme.scheme`] = 'https';
        labels[`traefik.http.routers.${serviceName}.middlewares`] = middlewareName;
      }
      if (tls) {
        labels[`traefik.http.routers.${serviceName}-tls.tls`] = 'true';
        if (certResolver) {
          labels[`traefik.http.routers.${serviceName}-tls.tls.certresolver`] = certResolver;
        }
        labels[`traefik.http.routers.${serviceName}-tls.rule`] = `Host(\`${virtualHost.domain}\`)`;
        labels[`traefik.http.routers.${serviceName}-tls.service`] = serviceName;
      }
    });

    service.labels = labels;
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
