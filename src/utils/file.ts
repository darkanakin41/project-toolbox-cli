import * as fs from 'fs'
import path from 'path'

const excluded = [
  'node_modules',
  'vendor',
]

export namespace File {

  export function isExcluded(path: string): boolean {
    let isExcluded = false;
    excluded.forEach((pattern:string) => {
      const regex = new RegExp(pattern)
      if(regex.test(path)) {
        isExcluded = true
      }
    })
    return isExcluded;
  }

  export function findAllFiles (dir: string, pattern: string): string[] {
    const files: string[] = fs.readdirSync(dir)
    files.forEach((file, index) => {
      files[index] = path.join(dir, file)
    })
    
    const regex = new RegExp(pattern)
    return files.filter((file) => {
      const stat = fs.statSync(file)
      return !stat.isDirectory() && regex.test(file)
    })
  }

  export function findAllFilesRecursive (dir: string, pattern: string): string[] {
    const files: string[] = fs.readdirSync(dir)
    files.forEach((file, index) => {
      files[index] = path.join(dir, file)
    })
    const subfolders: string[] = []
    files.forEach((file:string) => {
      const stat = fs.statSync(file)
      if (stat.isDirectory()) {
        if (!isExcluded(file)) {
          subfolders.push(file)
        }
      }
    })

    subfolders.forEach((subfolder:string) => {
      const subfiles = findAllFilesRecursive(subfolder, pattern)
      files.push(...subfiles)
    })

    const regex = new RegExp(pattern)
    return files.filter((file) => {
      const stat = fs.statSync(file)
      return !stat.isDirectory() && regex.test(file)
    })
  }
}
