import {SocketConfig, getProtocol} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

const SERVER_ADDRESS = `${getProtocol()}://${SocketConfig.TEST_SERVER_NAME}:${SocketConfig.SOCKET_PORT}`;
const PRIVILEGED_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.PRIVILEGED_NAMESPACE}`;
const DEBATE_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.DEBATE_NAMESPACE_PREFIX}`;

describe('Statistic functions test', () => {
    let debateManager;
    let admin;

    describe("Get stats", () => {
        before(async ()  => {
            debateManager = new DebateManager();
            await debateManager.start();

            admin = io.connect(`${PRIVILEGED_NAMESPACE}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    password: `${SocketConfig.ADMIN_PASSWORD}`,
                    username: `admin`
                }
            });
        });

        it("Get stats of specific admin", (done) => {
            admin.emit("getAdminStats", (adminStats) => {
                adminStats.length.should.equal(2);
                adminStats[1][0].id.should.equal(1);
                adminStats[1][1].id.should.equal(2);
                adminStats[1][0].title.should.equal("Debate1");
                adminStats[1][1].title.should.equal("Debate2");
                adminStats[1][0].time.should.equal("en cours");
                adminStats[1][1].time.should.not.equal("en cours");
                done();
            });
        });

        it("Get stats of specific debate", (done) => {
            let debateID = 1;
            admin.emit("getDebateStats", debateID, (debateStats) => {
                debateStats[0].should.equal(3);
                debateStats[1].should.equal(50);
                console.log(debateStats[2]);
                debateStats[2][0].numberVotes.should.equal(1);
                debateStats[2][1].numberVotes.should.equal(0);
                done();
            });
        });

        it("Get stats of specific question", (done) => {
            let debateID = 1;
            let questionID = 1;
            admin.emit("getQuestionStats", [ questionID, debateID ], (questionStats) => {
                questionStats[0].should.equal(2);// Verify number of responses
                questionStats[1].should.equal(2);// Verify percentage
                questionStats[2][0].response.should.equal("Yes");// Verify the response given
                questionStats[2][1].response.should.equal("No");
                questionStats[2][0].percentage.should.equal(100);// Verify the percentage of the responses
                questionStats[2][1].percentage.should.equal(0);
                done();
            });
        });

        it("Get stats of unknown debate", (done) => {
            let debateID = 100;
            admin.emit("getDebateStats", debateID, (debateStats) => {
                debateStats.length.should.equal(0);
                done();
            });
        });

        it("Get stats of unknown question", (done) => {
            let debateID = 4;
            let questionID = 100;
            admin.emit("getQuestionStats", [ questionID, debateID ], (questionStats) => {
                questionStats.length.should.equal(0);
                done();
            });
        });

        after(() => {
            admin.close();
        });
    });

    after(() => {
        debateManager.stop();
    });
});
