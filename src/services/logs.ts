import appRootDir from 'app-root-dir';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import logger from '../helpers/logger';
import { TypedResponse } from '../model/express';
import { generatePage } from '../helpers/page';
import { withBackLink } from '../helpers/components';
import messages from '../resources/messages';

/**
 * Handles LOGS request
 */
export default async function logs(_req: Express.Request, res: TypedResponse<string>) {
  try {
    const logFilePath = path.join(appRootDir.get(), 'logs', 'app.log');
    const fileStats = await stat(logFilePath);
    const logsContents = await readFile(logFilePath);
    const htmlResponse = `
    ${withBackLink(`${fileStats.size} ${messages.bytes}`, '/', messages.home)}
    ${withBackLink(`<pre>${logsContents}</pre>`, '/', messages.home)}
    `;
    res.send(generatePage(htmlResponse));
  } catch (error) {
    logger.error(`(logs) ${error}`);

    console.log(error);

    res.status(500).send(generatePage(withBackLink(messages.logs.none, '/', messages.home)));
  }
}
