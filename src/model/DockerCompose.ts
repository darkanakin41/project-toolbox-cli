export interface DockerCompose {
  volumes?: any;
  services: { [key: string]: any };
  networks?: { [key: string]: DockerComposeNetwork };
  version?: string;
}

export interface DockerComposeNetwork {
  external: boolean;
  name: string;
}

export interface DockerComposeService {
  image?: string;
  restart?: string;
  init?: boolean;
  environment?: { [key: string]: string | number | boolean };
  labels?: { [key: string]: string | number | boolean };
  ports?: string[];
  user?: string;
  volumes?: string[];
  networks?: string[];
  build?: DockerComposeServiceBuild;
  depends_on?: string[];

  // Custom Config
  applyUser?: boolean;
  buildImage?: boolean;
  binaries?: { [key: string]: DockerComposeBinary }; // TODO handle
  virtualHosts?: (DockerComposeVirtualHost | null)[];
}

export interface DockerComposeServiceBuild {
  context?: string;
}

export interface DockerComposeBinary {
  workdir?: string;
  command: string;
  exec?: boolean;
}

export interface DockerComposeVirtualHost {
  port: string;
  domain: string;
  name: string;
}
