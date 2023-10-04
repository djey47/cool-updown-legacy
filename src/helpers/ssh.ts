/**
 * SSH support functions
 */

import { ServerConfig } from '../model/models';
import { readPrivateKey } from './auth';

import type { Config } from 'node-ssh';

/**
 * @returns the proper SSH connection parameters from provider server config
 */
export async function getSSHParameters(serverConfiguration: ServerConfig): Promise<Config> {
  const { ssh: sshConf, network: netConf} = serverConfiguration;
  const privateKeyPath = sshConf?.keyPath;
  const privateKey = await readPrivateKey(privateKeyPath);

  return {
    host: netConf?.hostname,
    port: sshConf?.port,
    username: sshConf?.user,
    privateKey,
  };
}
