import {SocketConfig} from '../src/conf/config.js'
import {DebateManager} from "../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe('Debate test', () => {
    let debateManager;
    let admin;

    before(() => {
        debateManager = new DebateManager();
        debateManager.start();
    });

    describe("New debate", () => {
        before(() => {
            admin = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.ADMIN_NAMESPACE}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    password: `${SocketConfig.ADMIN_PASSWORD}`
                }
            });
        });

        it("New debate creation", (done) => {
            admin.emit("newDebate", (debateID) => {
                debateID.should.equal(1);
                done();
            });
        });

        after(() => {
            admin.close();
        });
    });

    describe("Debate client connection", () => {
        let client;
        let id;

        before((done) => {
            admin = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.ADMIN_NAMESPACE}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    password: `${SocketConfig.ADMIN_PASSWORD}`
                }
            });

            admin.emit("newDebate", (debateID) => {
                id = debateID;
                done();
            });
        });

        beforeEach(() => {
            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.DEBATE_NAMESPACE_PREFIX}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
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

        after(() => {
           admin.close();
        });
    });

    after(() => {
        debateManager.stop();
    });
});
