import {SocketConfig, getProtocol} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

const SERVER_ADDRESS = `${getProtocol()}://${SocketConfig.TEST_SERVER_NAME}:${SocketConfig.SOCKET_PORT}`;
const PRIVILEGED_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.PRIVILEGED_NAMESPACE}`;
const DEBATE_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.DEBATE_NAMESPACE_PREFIX}`;

describe('Debate basic functions test', () => {
    let debateManager;
    let admin;

    before(async ()  => {
        debateManager = new DebateManager();
        await debateManager.start();

        admin = io.connect(PRIVILEGED_NAMESPACE, {
            path: SocketConfig.DEFAULT_PATH,
            forceNew: true,
            query: {
                password: `${SocketConfig.ADMIN_PASSWORD}`,
                username: `admin`
            }
        });

        await new Promise(resolve => admin.on('connect', resolve));
    });

    describe("New debate creation", () => {
        it("should create debate", (done) => {
            let debateInfo = {
                title: 'My new debate',
                description: 'Test debate'
            };

            admin.emit("newDebate", debateInfo, (debateID) => {
                debateID.should.above(1);
                done();
            });
        });
    });

    describe("Debate client connection", () => {
        let client;
        let id;

        before((done) => {
            let debateInfo = {
                title: 'My new debate',
                description: 'Test debate'
            };

            admin.emit("newDebate", debateInfo, (debateID) => {
                id = debateID;
                done();
            });
        });

        beforeEach((done) => {
            client = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    uuid: '2345675432'
                }
            });

            client.on('connect', () => {
                done();
            });
        });

        it('should connect', (done) => {
            client.connected.should.equal(true);
            client.disconnected.should.equal(false);
            done();
        });

        it('should disconnect', (done) => {
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
        admin.close();
        debateManager.stop();
    });
});
