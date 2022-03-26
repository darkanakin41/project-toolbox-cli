import fs from "fs";
import path from "path";
import _ from "lodash";
import { File } from './file';
import YAML from 'yaml'

export module ConfigManager {
    const projectName = path.parse(process.cwd()).base;

    // TODO Remplacer par des données chargées dynamiquement
    const defaultConfig = {
        core: {
            domain: {
                sub: 'test',
                ext: 'com',
            },
            env: {
                current: 'dev',
            },
            project: {
                name: projectName
            }
        },
        docker: {
            port_prefix: 123,
            path_mapping: null,
        },
        jsonnet: {
            docker: {
                binary: {
                    disabled: false,
                    global: false,
                },
                build: {
                    cache_from_image: false,
                    context: {
                        base_directory: '.docker',
                        use_project_home: false,
                    },
                    image_tag: null,
                    image_tag_from: null,
                },
                compose: {
                    project_name: projectName,
                    network_name: 'default',
                    version: "3.7",
                    excluded_services: null,
                    included_services: null,
                },
                mount: {
                    disabled: true,
                },
                networks: {
                    names: { 'reverse-proxy': 'reverse-proxy' },
                },
                registry: {
                    name: null,
                    repository: null,
                },
                service: {
                    restart: 'no',
                    init: true,
                },
                user: {
                    uid: 1000, // Rendre automatique
                    gid: 1000, // Rendre automatique
                },
                virtualhost: {
                    disabled: false,
                    type: 'traefik',
                    network_id: "reverse-proxy",
                    certresolver: null,
                    https: false,
                    redirect_to_https: false,
                },
                xdebug: {
                    disabled: true,
                    host: null,
                    mode: 'debug',
                    version: null,
                    session: null,
                }
            }
        }
    };

    function loadConfigurationFile(file: string, configuration) {
        const fileContent = fs.readFileSync(file, 'utf8')
        const yamlContent = YAML.parse(fileContent)
        _.merge(configuration, yamlContent);
    }

    export const getProjectRoot = () => {
        return process.cwd()
    }

    export const getConfiguration = () => {
        const configuration = _.cloneDeep(defaultConfig)
        const folder = getProjectRoot()
        const ddb = File.findAllFiles(folder, 'ddb\\.ya?ml')[0]
        if (ddb) {
            console.log(`[ddb] using "${ddb}" configuration file`)
            loadConfigurationFile(ddb, configuration)
        }

        const ddbLocal = File.findAllFiles(folder, 'ddb\\.local\\.ya?ml')[0]
        if (ddbLocal) {
            console.log(`[ddb] using "${ddbLocal}" configuration file`)
            loadConfigurationFile(ddbLocal, configuration)
        }

        const ddbEnv = File.findAllFiles(folder, `ddb\\.${configuration.core.env.current}\\.ya?ml`)[0]
        if (ddbEnv) {
            console.log(`[ddb] using "${ddbEnv}" configuration file`)
            loadConfigurationFile(ddbEnv, configuration)
        }
        return configuration
    }
}