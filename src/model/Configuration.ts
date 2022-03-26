export default interface Configuration {
  compose: ComposeConfiguration;
  docker: DockerConfiguration;
  env: EnvConfiguration;
  project: ProjectConfiguration;
  reverseProxy: ReverseProxyConfiguration;
  files: FilesConfiguration;
  data: { [key: string]: string | number };
}

export interface ComposeConfiguration {
  network_name: string;
  version: string;
}

export interface DockerConfiguration {
  port_prefix: number | null;
  restart: 'no' | 'unless-stopped' | 'always';
  init: boolean;
  user: DockerUserConfiguration;
  build: DockerBuildConfiguration;
}

export interface DockerBuildConfiguration {
  baseDirectory: string;
}

export interface DockerUserConfiguration {
  uid: number;
  gid: number;
}

export interface EnvConfiguration {
  current: string;
}

export interface ProjectConfiguration {
  name: string;
  root: string;
}

export interface ReverseProxyConfiguration {
  enabled: boolean;
  type: 'traefik';
  network: string;
  redirectToHttps: boolean;
  tls: boolean;
  certResolver: null | 'letsencrypt';
  domain: ReverseProxyDomainConfiguration;
}

export interface ReverseProxyDomainConfiguration {
  sub: string;
  ext: string;
}

export interface FilesConfiguration {
  ignoredFolders: string[];
}
