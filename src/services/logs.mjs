import appRootDir from 'app-root-dir';
import { readFile } from 'fs/promises';
import path from 'path';
import logger from '../helpers/logger.mjs';

/**
 * Handles LOGS request
 */
export default async function logs(_req, res) {
  try {
    const logsContents = await readFile(path.join(appRootDir.get(), 'logs', 'app.log'));

    res.send(`<pre>${logsContents}<pre>`);
  } catch (error) {
    logger.error(`(logs) ${error}`);

    res.status(204).send();
  }
}
