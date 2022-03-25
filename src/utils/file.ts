import * as fs from 'fs'
import path from 'path'

const excludedFolders = [
  'node_modules',
  'vendor',
]

export namespace File {
  export function findAllFiles (dir: string, pattern: string): string[] {
    const files: string[] = fs.readdirSync(dir)
    files.forEach((file, index) => {
      files[index] = path.join(dir, file)
    })
    const subfolders: string[] = []
    files.forEach((file:string) => {
      const stat = fs.statSync(file)
      if (stat.isDirectory()) {
        if (excludedFolders.indexOf(file) === -1) {
          subfolders.push(file)
        }
      }
    })

    subfolders.forEach((subfolder:string) => {
      const subfiles = findAllFiles(subfolder, pattern)
      files.push(...subfiles)
    })

    const regex = new RegExp(pattern)
    return files.filter((file) => {
      return regex.test(file)
    })
  }
}
