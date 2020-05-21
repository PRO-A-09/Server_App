import {SocketConfig} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';
import {Discussion} from "../../src/database/modele/Discussion.js";
import {Question} from "../../src/database/modele/Question.js";
import {Response} from "../../src/database/modele/Response.js";
import {Device} from "../../src/database/modele/Device.js";

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
    const uuid = '2345675432';

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
                uuid: uuid
            }
        });

        client.on('connect', () => {
            done();
        });
    });

    it("should save debate", (done) => {
        Discussion.findOne({_id: id}, (err, discussion) => {
            discussion.should.not.equal(null);
            done();
        });
    });

    it('should save device save', (done) => {
        Device.findOne({_id: uuid}, (err, device) => {
            should.exist(device);
            should.not.exist(err);
            done();
        })
    });

    it('should save question', (done) => {
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

    it('should save question responses', (done) => {
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

    it('should save device to question response', (done) => {
        let newQuestionObj = {
            debateId: id,
            title: 'Does this test work ?',
            answers: ['Yes', 'No']
        };

        client.on('newQuestion', (questionObj) => {
            client.emit('answerQuestion', {questionId : questionObj.id, answerId : 0}, (res) => {
                Response.findOne({
                    id: 0,
                    refQuestion: {
                        refQuestion: questionObj.id,
                        refDiscussion: id
                    }
                }, (err, response) => {
                    should.exist(response);
                    should.not.exist(err);

                    response.devices.some(d => d.refDevice === uuid).should.equal(true);
                    done();
                });
            });
        });

        debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
    });

    afterEach(() => {
        client.close();
    });

    after(() => {
        admin.close();
        debateManager.stop();
    });
});
