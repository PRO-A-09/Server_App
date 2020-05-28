import {SocketConfig, ErrorMessage} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import request from 'request'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe('Server connection test', () => {
    const debateManager = new DebateManager();
    const srvAddress = `http://localhost:${SocketConfig.SOCKET_PORT}`;

    before(async () => {
        await debateManager.start();
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
                path: SocketConfig.DEFAULT_PATH,
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

        it('Socket.io default add new User', (done) => {
            client.emit('newAdmin', {password: "testetstetet", username:"myaccount"}, (res, err) => {
                res.should.equal(true);
                done();
            });
        });

        it('Socket.io add admin with short password', (done) => {
            client.emit('newAdmin', {password: "test", username:"myaccount"}, (res, err) => {
                res.should.equal(false);
                err.should.equal("Password is too short");
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

    describe('socket.io admin connection test', () => {
        let client;

        beforeEach(() => {
            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.PRIVILEGED_NAMESPACE}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    password: `${SocketConfig.ADMIN_PASSWORD}`,
                    username: `admin`
                }
            });
        });

        it('connection', (done) => {
            client.on('connect', () => {
                client.connected.should.equal(true);
                client.disconnected.should.equal(false);
                done();
            });
        });

        it('disconnect', (done) => {
            client.disconnect();
            client.disconnected.should.equal(true);
            client.connected.should.equal(false);
            done();
        });

        afterEach(() => {
            client.close();
        });
    });

    describe('socket.io invalid pass admin connect test', () => {
        let client;

        beforeEach(() => {
            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.PRIVILEGED_NAMESPACE}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    password: 'invalid',
                    username: `admin`
                }
            });
        });

        it('Socket.io connection test', (done) => {
            client.on('error', (err) => {
                err.should.equal(ErrorMessage.LOGIN_PASSWORD_INVALID);
                done();
            })
        });

        afterEach(() => {
            client.close();
        });
    });

    after(() => {
        debateManager.stop();
    });
});
