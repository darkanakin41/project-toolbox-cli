import { ConfigManager } from '../utils/config';
import { ObjectTools } from '../utils/object';

export const command: string = 'config';
export const desc: string = 'Display the current configuration';
export const builder = {};
export const handler = async (): Promise<void> => {
  const data = ConfigManager.getConfiguration();

  // @ts-ignore
  console.log(ObjectTools.flatten(data));
};
