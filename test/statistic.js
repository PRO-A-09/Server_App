import {SocketConfig} from '../src/conf/config.js'
import {DebateManager} from "../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe('Statistic test', () => {
    let debateManager;
    let admin;

    before(()  => {
        debateManager = new DebateManager();
        debateManager.start();
    });

    describe("Get stats", () => {
        before(() => {
            admin = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.ADMIN_NAMESPACE}`, {
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
                adminStats[1][0].time.should.equal("2h 0m");
                adminStats[1][1].time.should.equal("en cours");
                done();
            });
        });

        it("Get stats of specific debate", (done) => {
            let debateID = 1;
            admin.emit("getDebateStats", debateID, (debateStats) => {
                debateStats[0].should.equal(2);
                debateStats[1].should.equal(50);
                debateStats[2][0].numberVotes.should.equal(1);
                debateStats[2][1].numberVotes.should.equal(0);
                done();
            });
        });

        it("Get stats of specific question", (done) => {
            let debateID = 1;
            let questionID = 1;
            admin.emit("getQuestionStats", questionID, debateID, (questionStats) => {
                questionStats[0].should.equal(2);// Verify number of responses
                questionStats[1].should.equal(2);// Verify percentage
                questionStats[2][0].response.should.equal("Yes");// Verify the response given
                questionStats[2][1].response.should.equal("No");
                questionStats[2][0].percentage.should.equal(100);// Verify the percentage of the responses
                questionStats[2][1].percentage.should.equal(0);
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
