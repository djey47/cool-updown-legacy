/**
 * Unit testing support functions
 */

import { ApiRequest } from "../model/models";

/**
 * @param expressResponseMock 
 * @returns an Express default response (with mocks) for unit tests
 */
export const generateDefaultResponse = (expressResponseMock) => ({
  status: c => expressResponseMock.statusMock(c),
  send: msg => expressResponseMock.sendMock(msg),
  json: ()  => expressResponseMock.jsonMock(),
});

/**
 * @param pathParams path params to include into this request
 * @returns a default API request with specified path parameters
 */
export const generateDefaultRequest = (pathParams: object): ApiRequest => ({
  params: { ... pathParams },
});

/**
 * @returns default app state for unit tests
 */
export const generateDefaultAppState = () => ({
  isScheduleEnabled: true,
  startedAt: new Date('June 12, 2018 13:14:00Z'),
  servers: [{}],
});
