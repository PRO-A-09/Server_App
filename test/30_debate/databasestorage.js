import {SocketConfig} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';
import {Discussion} from "../../src/database/modele/Discussion.js";
import {Question} from "../../src/database/modele/Question.js";
import {Response} from "../../src/database/modele/Response.js";

const expect = chai.expect;
const should = chai.should();

const SERVER_ADDRESS = `http://localhost:${SocketConfig.SOCKET_PORT}`;
const PRIVILEGED_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.PRIVILEGED_NAMESPACE}`;
const DEBATE_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.DEBATE_NAMESPACE_PREFIX}`;

describe("Debate database storage test", () => {
    let debateManager;
    let admin;
    let client;
    let id;
    let debate;

    before(async () => {
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

        let debateInfo = {
            title: 'My new debate',
            description: 'Test debate'
        };

        await new Promise(resolve => {
            admin.emit("newDebate", debateInfo, (debateID) => {
                id = debateID;
                resolve();
            });
        });
    });

    beforeEach((done) => {
        debate = debateManager.nspAdmin.getActiveDebate(id);

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

    it("Debate save", (done) => {
        Discussion.findOne({_id: id}, (err, discussion) => {
            discussion.should.not.equal(null);
            done();
        });
    });

    it('Question save', (done) => {
        let newQuestionObj = {
            debateId: id,
            title: 'Does this test work ?',
            answers: ['Yes', 'No']
        };

        admin.emit('newQuestion', newQuestionObj, (questionId) => {
            Question.findOne({id: questionId, refDiscussion: id}, (err, question) => {
                should.exist(question);
                done();
            });
        });
    });

    it('Question response save', (done) => {
        let newQuestionObj = {
            debateId: id,
            title: 'Does this test work ?',
            answers: ['Yes', 'No']
        };

        admin.emit('newQuestion', newQuestionObj, (questionId) => {
            Question.findOne({id: questionId, refDiscussion: id}, (err, question) => {
                Response.findOne({
                    id: 0,
                    refQuestion: {
                        refQuestion: questionId,
                        refDiscussion: id
                    }
                }, (err, response) => {
                    should.exist(response);
                    should.not.exist(err);
                    done();
                });
            });
        });
    });

    afterEach(() => {
        client.close();
    });

    after(() => {
        admin.close();
        debateManager.stop();
    });
});
