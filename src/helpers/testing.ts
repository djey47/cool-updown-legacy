/**
 * Unit testing support functions
 */

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
 * @returns default app state for unit tests
 */
export const generateDefaultAppState = () => ({
  isScheduleEnabled: true,
  startedAt: new Date('June 12, 2018 13:14:00Z'),
});
