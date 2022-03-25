import { Jsonnet, JsonnetPrimitiveValue } from "@hanazuki/node-jsonnet";
import path from "path";
import { ObjectTools } from "./object";

export namespace JsonnetTools {
    let configuration: object|undefined
    function GetNetworkName(key: JsonnetPrimitiveValue): any {
        if(configuration === undefined){
            return key
        }
        const network_names = configuration.jsonnet.docker.networks.names
        return network_names[key] ?? key
    }
    function MapPath(path: JsonnetPrimitiveValue): any {
        if(configuration === undefined){
            return path
        }
        
        const mappings = configuration.docker.path_mapping
        if (path === null) {
            return null
        }
        if (mappings === null) {
            return path
        }

        let mapping = null
        Object.keys(mappings).forEach((_mapping) => {
            if (path.toString().indexOf(_mapping) === 0) {
                mapping = _mapping
            }
        })

        if (mapping === null) {
            return
        }

        return path.toString().replace(mapping, mappings[mapping])
    }

    export const process = async (content: string, data: { [key: string]: any }): Promise<string> => {
        configuration = data
        const jsonnet = new Jsonnet();
        jsonnet.addJpath(path.join(__dirname, '..', '..', 'libs', 'jsonnet'))
        jsonnet.nativeCallback("null", () => null);
        jsonnet.nativeCallback("true", () => true);
        jsonnet.nativeCallback("false", () => false);

        jsonnet.nativeCallback("GetNetworkName", GetNetworkName, "key");
        jsonnet.nativeCallback("MapPath", MapPath, "path");

        const flattenConfig = ObjectTools.flatten(data)

        Object.keys(flattenConfig).forEach((key) => {
            const value: string | null = flattenConfig[key]
            if (value === 'true' || value === 'false' || value === 'emptyobject') {
                jsonnet.extCode(key, value)
            } else if (value === null) {
                jsonnet.extCode(key, 'null')
            } else if (value.indexOf('{') !== -1) {
                jsonnet.tlaCode(key, value)
            } else {
                jsonnet.extString(key, value)
            }
        })

        const jsonResult = await jsonnet.evaluateSnippet(content)
        const result = JSON.parse(jsonResult);
        delete result["__post_processors__"];
        
        configuration = undefined
        return result;
    }
}