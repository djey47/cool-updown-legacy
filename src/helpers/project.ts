import appRootDir from 'app-root-dir';
import path from 'path';
import { readFile } from 'fs/promises';

export interface PackageConfig {
  name: string;
  version: string;
}

/**
 * @returns config as object, defined in the root package.json file
 */
export async function readPackageConfiguration() {
  const configFile = path.resolve(appRootDir.get(), 'package.json');
  const rawContents = await readFile(configFile, 'utf-8');
  return JSON.parse(rawContents) as PackageConfig;
}
