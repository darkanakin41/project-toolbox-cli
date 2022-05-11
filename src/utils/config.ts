import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { File } from './file';
import yaml from 'js-yaml';
import os, { NetworkInterfaceInfo, networkInterfaces } from 'os';
import Configuration from '../model/Configuration';
import { Logger } from './logger';

export module ConfigManager {
  const userInfo = os.userInfo();

  let calculatedConfiguration: Configuration | null = null;
  const defaultConfig: Configuration = {
    binary: {
      directory: '.bin',
    },
    compose: {
      network_name: 'default',
      version: '3.7',
    },
    docker: {
      port_prefix: 123,
      restart: 'no',
      init: true,
      user: {
        uid: userInfo.uid,
        gid: userInfo.gid,
      },
      build: {
        baseDirectory: '.docker',
      },
    },
    env: {
      current: 'dev',
    },
    files: {
      ignoredFolders: [],
    },
    host: {
      nics: [],
      ips: [],
    },
    project: {
      name: '',
      root: '',
    },
    reverseProxy: {
      enabled: true,
      type: 'traefik',
      network: 'reverse-proxy',
      redirectToHttps: false,
      tls: false,
      certResolver: null,
      domain: {
        sub: 'test',
        ext: 'com',
      },
      privateDomain: {
        sub: 'test',
        ext: 'com',
      },
    },
    data: {},
  };

  function loadConfigurationFile(file: string, configuration: object) {
    if (!fs.existsSync(file)) {
      return;
    }
    const fileContent = fs.readFileSync(file, 'utf8');
    const yamlContent = yaml.load(fileContent);
    _.merge(configuration, yamlContent);
  }

  function updateHostConfiguration(configuration: Configuration): void{
    const interfaces: NodeJS.Dict<NetworkInterfaceInfo[]> = networkInterfaces()
    Object.keys(interfaces).forEach((interfaceName) => {
      if(interfaceName.indexOf('veth') === -1 && interfaceName.indexOf('br-') === -1 && interfaceName.indexOf('lo') === -1){
        
        const IPV4Configuration = interfaces[interfaceName]?.find((ipConfiguration) => {
          return ipConfiguration.family === 'IPv4'
        })

        if (IPV4Configuration) {
          configuration.host.nics.push(interfaceName)
          configuration.host.ips.push(IPV4Configuration.address)
        }
      }
    })
  }

  export const getProjectRoot = (): string => {
    let folder = process.cwd();
    if (fs.existsSync(path.join(folder, 'pt.yaml'))) {
      return process.cwd();
    }

    while (folder !== path.parse(folder).root) {
      folder = path.parse(folder).dir;
      if (fs.existsSync(path.join(folder, 'pt.yaml'))) {
        return folder;
      }
    }
    Logger.error(`project-toolbox not configured, please create a pt.yaml at root folder of your project`, true);
    return '';
  };

  export const getConfiguration = () => {
    if (calculatedConfiguration !== null) {
      return calculatedConfiguration;
    }
    const configuration = _.cloneDeep(defaultConfig);

    const home = File.findAllFiles(userInfo.homedir, '\\.pt\\.yaml')[0];
    if (home) {
      Logger.debug(`using "${home}" configuration file`);
      loadConfigurationFile(home, configuration);
    }

    configuration.project.root = getProjectRoot();
    configuration.project.name = path.parse(configuration.project.root).base;
    const main = File.findAllFiles(configuration.project.root, 'pt\\.yaml')[0];
    if (main) {
      Logger.debug(`using "${main.replace(getProjectRoot(), '')}" configuration file`);
      loadConfigurationFile(main, configuration);
      configuration.reverseProxy.domain.sub = configuration.project.name.replace(/[^a-zA-Z0-9]/g, '-');
      configuration.reverseProxy.privateDomain.sub = configuration.project.name.replace(/[^a-zA-Z0-9]/g, '-');
    }

    const local = File.findAllFiles(configuration.project.root, 'pt\\.local\\.ya?ml')[0];
    if (local) {
      Logger.debug(`using "${local.replace(getProjectRoot(), '')}" configuration file`);
      loadConfigurationFile(local, configuration);
    }

    const environment = File.findAllFiles(configuration.project.root, `pt\\.${configuration.env.current}\\.ya?ml`)[0];
    if (environment) {
      Logger.debug(`using "${environment.replace(getProjectRoot(), '')}" configuration file`);
      loadConfigurationFile(environment, configuration);
    }
    calculatedConfiguration = configuration;

    updateHostConfiguration(configuration);
    return configuration;
  };
}
