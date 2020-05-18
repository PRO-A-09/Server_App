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

describe("Debate client functions", () => {
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

    describe('getQuestions', () => {
        it('should send empty array', (done) => {
            client.emit('getQuestions', (questions) => {
                questions.length.should.equal(0);
                done();
            });
        });

        it('should send questions array', (done) => {
            const NB_QUESTIONS = 3;
            for (let i = 0; i < NB_QUESTIONS; ++i)
                debate.sendNewQuestion(new debate.Question(`Question${i}`, ['...']));

            client.emit('getQuestions', (questions) => {
                questions.length.should.equal(NB_QUESTIONS);
                for (let i = 0; i < questions.length; ++i)
                    questions[i].title.should.equal(`Question${i}`);

                done();
            })
        });
    });

    describe('newQuestion', () => {
        it('should receive question', (done) => {
            client.on('newQuestion', (questionObj) => {
                questionObj.title.should.equal('Does this test work ?');
                questionObj.answers[0].should.equal('Yes');
                questionObj.answers[1].should.equal('No');
                done();
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
        });

        it('should receive open question', (done) => {
            client.on('newQuestion', (questionObj) => {
                questionObj.title.should.equal('Does this test work ?');
                questionObj.answers.length.should.equal(0);
                questionObj.isOpenQuestion.should.equal(true);
                done();
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', null, true));
        });
    });

    describe('answerQuestion', () => {
        it('should answer question', (done) => {
            client.on('newQuestion', (questionObj) => {
                client.emit('answerQuestion', {questionId : questionObj.id, answerId : 0}, (res) => {
                    res.should.equal(true);
                    done();
                });
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
        });

        it('should not work with invalid questionId', (done) => {
            client.on('newQuestion', (questionObj) => {
                client.emit('answerQuestion', {questionId : -1, answerId : 1}, (res) => {
                    res.should.equal(false);
                    done();
                });
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
        });

        it('should not work with invalid object', (done) => {
            client.on('newQuestion', (questionObj) => {
                client.emit('answerQuestion', {myFieldIsInvalid: 12}, (res) => {
                    res.should.equal(false);
                    done();
                });
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
        });
    });

    describe('answerOpenQuestion', () => {
        it('should answer open question', (done) => {
            client.on('newQuestion', (questionObj) => {
                client.emit('answerOpenQuestion', {questionId : questionObj.id, answer : 'Hopefully, yes'}, (res) => {
                    res.should.equal(true);

                    let question = debate.questions.get(questionObj.id);
                    question.answers[0].answer.should.equal('Hopefully, yes');
                    done();
                });
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', null, true));
        });

        it('should not work with invalid questionId', (done) => {
            client.on('newQuestion', (questionObj) => {
                client.emit('answerOpenQuestion', {questionId : -1, answer : 'Hey'}, (res) => {
                    res.should.equal(false);
                    done();
                });
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', null, true));
        });

        it('should not work with invalid object', (done) => {
            client.on('newQuestion', (questionObj) => {
                client.emit('answerOpenQuestion', {myFieldIsInvalid: 12}, (res) => {
                    res.should.equal(false);
                    done();
                });
            });

            debate.sendNewQuestion(new debate.Question('Does this test work ?', null, true));
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
