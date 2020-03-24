import {SocketConfig} from '../src/config.js'
import {DebateManager} from "../src/debatemanager.js";
import io from 'socket.io-client'
import request from 'request'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe('Server connection test', () => {
    const debateManager = new DebateManager();
    const srvAddress = `http://localhost:${SocketConfig.SOCKET_PORT}`;

    before(() => {
        debateManager.start();
    });

    it('Server response body', (done) => {
        request(srvAddress , (err, req, body) => {
            expect(body).to.equal('Socket.io server');
            done();
        });
    });

    describe('socket.io connection test', () => {
        let client;

        beforeEach(() => {
            client = io.connect(srvAddress, {
                path: '${SocketConfig.DEFAULT_PATH}',
                forceNew: true
            });
        });

        it('Socket.io default namespace connection', (done) => {
            client.on('connect', () => {
                client.connected.should.equal(true);
                client.disconnected.should.equal(false);
                done();
            });
        });

        it('Socket.io default namespace disconnect', (done) => {
            client.disconnect();
            client.disconnected.should.equal(true);
            client.connected.should.equal(false);
            done();
        });

        afterEach(() => {
            client.close();
        });
    });

    after(() => {
        debateManager.stop();
    });
});
