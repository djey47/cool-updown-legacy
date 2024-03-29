import globalMocks from '../../config/jest/globalMocks';

const {
    axiosMock, expressResponseMock, nodeFSMock, nodeChildProcessMock, systemGatewayMock, nodesshMock, pageMock, sshMock, authMock
} = globalMocks;
  
export default function() {
    axiosMock.get.mockReset();
    expressResponseMock.sendMock.mockReset();
    expressResponseMock.statusMock.mockReset();
    nodeFSMock.readFile.mockReset();
    nodeFSMock.stat.mockReset();
    nodeChildProcessMock.exec.mockReset();
    systemGatewayMock.pingMock.mockReset();
    nodesshMock.connect.mockReset();
    nodesshMock.dispose.mockReset();
    nodesshMock.execCommand.mockReset();
    pageMock.generatePage.mockReset();
    sshMock.getSSHParameters.mockReset();
    authMock.readPrivateKey.mockReset();
}
