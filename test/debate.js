import {SocketConfig} from '../src/conf/config.js'
import {DebateManager} from "../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe('Debate test', () => {
    let debateManager;
    let admin;

    before(()  => {
        debateManager = new DebateManager();
        debateManager.start();
    });

    describe("New debate", () => {
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

        it("New debate creation", (done) => {
            let debateInfo = {
                title: 'My new debate',
                description: 'Test debate'
            };

            admin.emit("newDebate", debateInfo, (debateID) => {
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
                    password: `${SocketConfig.ADMIN_PASSWORD}`,
                    username: `admin`
                }
            });

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
                    password: `${SocketConfig.ADMIN_PASSWORD}`,
                    username: `admin`
                }
            });

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
            debate = debateManager.nspAdmin.getActiveDebate(id);

            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.DEBATE_NAMESPACE_PREFIX}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
            });

            client.on('connect', () => {
                done();
            });
        });

        describe('getQuestions', () => {
            it('no questions', (done) => {
                client.emit('getQuestions', (questions) => {
                    questions.length.should.equal(0);
                    done();
                });
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
                    password: `${SocketConfig.ADMIN_PASSWORD}`,
                    username: `admin`
                }
            });

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
            debate = debateManager.nspAdmin.getActiveDebate(id);

            client = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.DEBATE_NAMESPACE_PREFIX}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
            });

            client.on('connect', () => {
                done();
            });
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

        describe('newQuestion', () => {
            it('valid question', (done) => {
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

            it('invalid question', (done) => {
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
            it('array of debates', (done) => {
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

            it ('valid debate', (done) => {
                admin.emit('getDebateQuestions', id, (res) => {
                    res.length.should.equal(1);
                    res[0].title.should.equal('Does this test work ?');
                    res[0].answers[0].should.equal('Yes');
                    res[0].answers[1].should.equal('No');
                    done();
                });
            });

            it ('invalid debate', (done) => {
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
        });
    });

    after(() => {
        debateManager.stop();
    });
});
