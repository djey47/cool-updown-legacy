/**
 * Provides utility functions to handle Cool-updown API requests and responses
 */

import { TypedResponse } from "../model/express";
import { ApiRequest } from "../model/models";
import messages from "../resources/messages";

/**
 * @param request API request from Express middleware
 * @returns server identifier which is passed through a path parameter
 */
function extractServerIdentifier(request: ApiRequest) {
  return request.params.serverId;
}

/**
 * 
 * @param request 
 * @param response 
 * @returns 
 */
export function validateInputParameters(request: ApiRequest, response: TypedResponse<string>) {
  const serverId = extractServerIdentifier(request);
  if (!serverId) {
    response.status(400).send(messages.errors.invalidArg);
  }
  return {
    serverId,
  };
}


