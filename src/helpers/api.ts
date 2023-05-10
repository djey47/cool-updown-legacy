/**
 * Provides utility functions to handle Cool-updown API requests and responses
 */

import { ApiRequest } from "../model/models";

/**
 * @param request API request from Express middleware
 * @returns server identifier which is passed through a path parameter
 */
export function extractServerIdentifier(request: ApiRequest) {
  return request.params.serverId;
}
