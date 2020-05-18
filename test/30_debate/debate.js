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

describe('Debate test', () => {
    let debateManager;
    let admin;

    before(async ()  => {
        debateManager = new DebateManager();
        await debateManager.start();
    });

    describe("Debate admin functions", () => {
        let client;
        let id;
        let debate;

        before((done) => {
            admin = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.PRIVILEGED_NAMESPACE}`, {
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
                query: {
                    uuid: '2345675432'
                }
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

    describe("Database storage", () => {
        let client;
        let id;
        let debate;

        before((done) => {
            admin = io.connect(`http://localhost:${SocketConfig.SOCKET_PORT}${SocketConfig.PRIVILEGED_NAMESPACE}`, {
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
        });
    });

    after(() => {
        debateManager.stop();
    });
});
