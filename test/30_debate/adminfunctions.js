import {SocketConfig} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';
import {dbManager} from "../../src/database/DatabaseManager.js";
import {Discussion} from "../../src/database/modele/Discussion.js";
import {Question} from "../../src/database/modele/Question.js";
import {Response} from "../../src/database/modele/Response.js";

const expect = chai.expect;
const should = chai.should();

const SERVER_ADDRESS = `http://localhost:${SocketConfig.SOCKET_PORT}`;
const PRIVILEGED_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.PRIVILEGED_NAMESPACE}`;
const DEBATE_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.DEBATE_NAMESPACE_PREFIX}`;

describe("Debate admin functions", () => {
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

    describe('questionAnswered', () => {
        it('should receive question answer', (done) => {
            let question = new debate.Question('Does this test work ?', ['Yes', 'No']);

            admin.on('questionAnswered', (questionObj) => {
                questionObj.questionId.should.equal(question.id);
                questionObj.answerId.should.equal(0);
                done();
            });

            client.on('newQuestion', (questionObj) => {
                client.emit('answerQuestion', {questionId : questionObj.id, answerId : 0}, (res) => {
                    res.should.equal(true);
                });
            });

            debate.sendNewQuestion(question);
        });
    });

    describe('newQuestion', () => {
        it('should return questionId', (done) => {
            let newQuestionObj = {
                debateId: id,
                title: 'Does this test work ?',
                answers: ['Yes', 'No']
            };

            admin.emit('newQuestion', newQuestionObj, (questionId) => {
                questionId.should.not.equal(-1);
                done();
            });
        });

        it('should not work with invalid object', (done) => {
            let newQuestionObj = {
                debateId: id,
                answers: ['Yes', 'No']
            };

            admin.emit('newQuestion', newQuestionObj, (questionId) => {
                questionId.should.equal(-1);
                done();
            });
        });
    });

    describe('getDebates', () => {
        it('should send array of debates', (done) => {
            let debateInfo = {
                title: 'My new debate',
                description: 'Test debate'
            };

            admin.emit("newDebate", debateInfo, (debateID) => {
                id = debateID;

                admin.emit('getDebates', (debates) => {
                    const debate = debates.find(d => d.debateId === id);
                    debate.title.should.equal('My new debate');
                    debate.description.should.equal('Test debate');
                    done();
                });
            });
        });
    });

    describe('getDebateQuestions', () => {
        before((done) => {
            let newQuestionObj = {
                debateId: id,
                title: 'Does this test work ?',
                answers: ['Yes', 'No']
            };

            admin.emit('newQuestion', newQuestionObj, (questionId) => {
                questionId.should.not.equal(-1);
                done();
            });
        });

        it('should send debate questions', (done) => {
            admin.emit('getDebateQuestions', id, (res) => {
                res.length.should.equal(1);
                res[0].title.should.equal('Does this test work ?');
                res[0].answers[0].should.equal('Yes');
                res[0].answers[1].should.equal('No');
                done();
            });
        });

        it('should not send questions with invalid debateId', (done) => {
            admin.emit('getDebateQuestions', -1, (res) => {
                res.should.equal(-1);
                done();
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
