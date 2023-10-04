/**
 * Provides utility functions to handle Cool-updown API requests and responses
 */

import messages from "../resources/messages";

import type { ApiRequest, ApiInputParameters } from '../model/api';
import type { TypedResponse } from "../model/express";

/**
 * @param request API request from Express middleware
 * @returns server identifier which is passed through a path parameter
 */
function extractServerIdentifier(request: ApiRequest) {
  const { params: { serverId } } = request;
  if (serverId === undefined) {
    return undefined;
  }
  return Number(serverId);
}

/**
 * @returns validated input parameters provided to API
 */
export function validateInputParameters(request: ApiRequest, response: TypedResponse<string>): ApiInputParameters {
  const serverId = extractServerIdentifier(request);
  if (serverId === undefined) {
    // FIXME let service handle such errors
    response.status(400).send(messages.errors.invalidArg);
  }
  return {
    serverId,
  };
}


