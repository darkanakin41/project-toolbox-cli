import fs from 'fs';
import path from 'path';
import _ from 'lodash';
import { File } from './file';
import yaml from 'js-yaml';
import os from 'os';
import Configuration from '../model/Configuration';

export module ConfigManager {
  const userInfo = os.userInfo();

  let calculatedConfiguration: Configuration | null = null;
  const defaultConfig: Configuration = {
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
    console.error('project-toolbox not configured, please create a pt.yaml at root folder of your project');
    process.exit(1);
  };

  export const getConfiguration = () => {
    if (calculatedConfiguration !== null) {
      return calculatedConfiguration;
    }
    const configuration = _.cloneDeep(defaultConfig);

    const home = File.findAllFiles(userInfo.homedir, '\\.pt\\.yaml')[0];
    if (home) {
      console.log(`using "${home}" configuration file`);
      loadConfigurationFile(home, configuration);
    }

    configuration.project.root = getProjectRoot();
    configuration.project.name = path.parse(configuration.project.root).base;
    const main = File.findAllFiles(configuration.project.root, 'pt\\.yaml')[0];
    if (main) {
      console.log(`using "${main.replace(getProjectRoot(), '')}" configuration file`);
      loadConfigurationFile(main, configuration);
      configuration.reverseProxy.domain.sub = configuration.project.name.replace(/[^a-zA-Z0-9]/g, '-');
    }

    const local = File.findAllFiles(configuration.project.root, 'pt\\.local\\.ya?ml')[0];
    if (local) {
      console.log(`using "${local.replace(getProjectRoot(), '')}" configuration file`);
      loadConfigurationFile(local, configuration);
    }

    const environment = File.findAllFiles(configuration.project.root, `pt\\.${configuration.env.current}\\.ya?ml`)[0];
    if (environment) {
      console.log(`using "${environment.replace(getProjectRoot(), '')}" configuration file`);
      loadConfigurationFile(environment, configuration);
    }
    calculatedConfiguration = configuration;
    return configuration;
  };
}
