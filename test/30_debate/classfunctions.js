import {SocketConfig, getProtocol} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

const SERVER_ADDRESS = `${getProtocol()}://${SocketConfig.TEST_SERVER_NAME}:${SocketConfig.SOCKET_PORT}`;
const PRIVILEGED_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.PRIVILEGED_NAMESPACE}`;
const DEBATE_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.DEBATE_NAMESPACE_PREFIX}`;

describe("Debate class functions", () => {
    let debateManager;
    let admin;
    let id;
    let debate;

    before(async () => {
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

    beforeEach((done) => {
        let debateInfo = {
            title: 'My new debate',
            description: 'Test debate'
        };
        admin.emit("newDebate", debateInfo, (debateID) => {
            id = debateID;
            debate = debateManager.nspAdmin.getActiveDebate(id);
            done();
        });
    });

    describe('getNbUniqueClients', () => {
        it('should return nb unique clients', async () => {
            const NB_CLIENTS = 3;
            let clients = [];
            let promises = [];

            for (let i = 0; i < NB_CLIENTS; ++i) {
                clients[i] = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                    path: SocketConfig.DEFAULT_PATH,
                    forceNew: true,
                    query: {
                        uuid: `${1000 + i}`
                    }
                });

                promises.push(new Promise(resolve => {
                    clients[i].on('connect', resolve);
                }));
            }

            await Promise.all(promises);
            debate.getNbUniqueClients().should.equal(NB_CLIENTS);

            for (let i = 0; i < NB_CLIENTS; ++i) {
                clients[i].close();
            }
        });

        it('should ignore duplicates clients', async () => {
            const NB_CLIENTS = 3;
            let clients = [];
            let promises = [];
            for (let i = 0; i < NB_CLIENTS; ++i) {
                clients[i] = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                    path: SocketConfig.DEFAULT_PATH,
                    forceNew: true,
                    query: {
                        uuid: '1000'
                    }
                });

                promises.push(new Promise(resolve => {
                    clients[i].on('connect', resolve);
                }));
            }

            await Promise.all(promises);
            debate.getNbUniqueClients().should.equal(1);

            for (let i = 0; i < NB_CLIENTS; ++i) {
                clients[i].close();
            }
        });
    });

    after(() => {
        admin.close();
        debateManager.stop();
    });
});