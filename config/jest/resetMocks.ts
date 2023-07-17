import globalMocks from '../../config/jest/globalMocks';

const {
    axiosMock, expressResponseMock, nodeFSMock, systemGatewayMock, nodesshMock, pageMock
} = globalMocks;
  
export default function() {
    axiosMock.get.mockReset();
    expressResponseMock.sendMock.mockReset();
    expressResponseMock.statusMock.mockReset();
    nodeFSMock.readFile.mockReset();
    systemGatewayMock.pingMock.mockReset();
    nodesshMock.connect.mockReset();
    nodesshMock.dispose.mockReset();
    nodesshMock.execCommand.mockReset();
    pageMock.generatePage.mockReset();
}
