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
