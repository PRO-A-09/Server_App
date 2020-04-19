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

        beforeEach((done) => {
            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.DEBATE_NAMESPACE_PREFIX}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
            });

            client.on('connect', () => {
                done();
            });
        });

        it('connection', (done) => {
            client.connected.should.equal(true);
            client.disconnected.should.equal(false);
            done();
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

    describe("Debate client functions", () => {
        let client;
        let id;
        let debate;

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

        beforeEach((done) => {
            debate = debateManager.nspAdmin.getActiveDebate(id);

            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.DEBATE_NAMESPACE_PREFIX}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
            });

            client.on('connect', () => {
                done();
            })
        });

        describe('getQuestions', () => {
            it('no questions', (done) => {
                client.emit('getQuestions', (questions) => {
                    questions.length.should.equal(0);
                    done();
                })
            });

            it('available questions', (done) => {
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
            it('valid question', (done) => {
                client.on('newQuestion', (questionObj) => {
                    questionObj.title.should.equal('Does this test work ?');
                    questionObj.answers[0].should.equal('Yes');
                    questionObj.answers[1].should.equal('No');
                    done();
                });

                debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
            });
        });

        describe('answerQuestion', () => {
            it('valid response', (done) => {
                client.on('newQuestion', (questionObj) => {
                    client.emit('answerQuestion', {questionId : questionObj.id, answerId : 0}, (res) => {
                        res.should.equal(true);
                        done();
                    });
                });

                debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
            });

            it('invalid questionID', (done) => {
                client.on('newQuestion', (questionObj) => {
                    client.emit('answerQuestion', {questionId : -1, answerId : 1}, (res) => {
                        res.should.equal(false);
                        done();
                    });
                });

                debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
            });

            it('invalid object', (done) => {
                client.on('newQuestion', (questionObj) => {
                    client.emit('answerQuestion', {myFieldIsInvalid: 12}, (res) => {
                        res.should.equal(false);
                        done();
                    });
                });

                debate.sendNewQuestion(new debate.Question('Does this test work ?', ['Yes', 'No']));
            });
        });

        afterEach(() => {
            client.close();
        });

        after(() => {
            admin.close();
        });
    });

    describe("Debate admin functions", () => {
        let client;
        let id;
        let debate;

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

        beforeEach((done) => {
            debate = debateManager.nspAdmin.getActiveDebate(id);

            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.DEBATE_NAMESPACE_PREFIX}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
            });

            client.on('connect', () => {
                done();
            })
        });

        describe('questionAnswered', () => {
            it('valid answer', (done) => {
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
