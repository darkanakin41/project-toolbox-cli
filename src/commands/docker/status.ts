import { Arguments, Options } from 'yargs'
import path from 'path'
import { Docker } from '../../utils/docker'

export const command: string = 'status'
export const desc: string = 'Get the status of the current project'
export const builder = {}
export const handler = async (argv: Arguments<Options>): Promise<void> => {
  const projectName = path.parse(process.cwd()).base

  if (Docker.isDockerized(process.cwd())) {
    console.log(`[docker] ${projectName}: dockerized`)
  }else{
    console.error(`[docker] ${projectName}: not dockerized`)
  }
  if (Docker.isDdbized(process.cwd())) {
    console.log(`[docker] ${projectName}: ddbized`)
  }else{
    console.error(`[docker] ${projectName}: not ddbized`)
  }
};
