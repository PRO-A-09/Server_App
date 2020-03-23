import {SocketConfig} from '../src/config.js'
import {DebateManager} from "../src/debatemanager.js";
import request from 'request'
import chai from 'chai';

const expect = chai.expect;

describe('Server connection test', _ => {
    const debateManager = new DebateManager();

    before(() => {
        debateManager.start();
    });

    it('Server response body', () => {
        request(`http://localhost:${SocketConfig.SOCKET_PORT}` , (err, req, body) => {
            expect(body).to.equal('Socket.io server');
        });
    });

    after(() => {
        debateManager.stop();
    });
});
