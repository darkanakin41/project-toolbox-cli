import { AnObject } from '../utils/object';

export default interface Configuration extends AnObject {
  binary: BinaryConfiguration;
  compose: ComposeConfiguration;
  data: { [key: string]: string | number };
  docker: DockerConfiguration;
  env: EnvConfiguration;
  files: FilesConfiguration;
  host: HostConfiguration;
  project: ProjectConfiguration;
  reverseProxy: ReverseProxyConfiguration;
}

export interface BinaryConfiguration extends AnObject {
  directory: '.bin';
}

export interface ComposeConfiguration extends AnObject {
  network_name: string;
  version: string;
}

export interface DockerConfiguration extends AnObject {
  port_prefix: number | null;
  restart: 'no' | 'unless-stopped' | 'always';
  init: boolean;
  user: DockerUserConfiguration;
  build: DockerBuildConfiguration;
}

export interface DockerBuildConfiguration extends AnObject {
  baseDirectory: string;
}

export interface DockerUserConfiguration extends AnObject {
  uid: number;
  gid: number;
}

export interface EnvConfiguration extends AnObject {
  current: string;
}

export interface ProjectConfiguration extends AnObject {
  name: string;
  root: string;
}

export interface ReverseProxyConfiguration extends AnObject {
  enabled: boolean;
  type: 'traefik';
  network: string;
  redirectToHttps: boolean;
  tls: boolean;
  certResolver: null | 'letsencrypt';
  domain: ReverseProxyDomainConfiguration;
  privateDomain: ReverseProxyDomainConfiguration;
}

export interface ReverseProxyDomainConfiguration extends AnObject {
  sub: string;
  ext: string;
}

export interface FilesConfiguration extends AnObject {
  ignoredFolders: string[];
}

export interface HostConfiguration extends AnObject {
  nics: string[];
  ips: string[];
}
