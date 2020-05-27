import {SocketConfig, ErrorMessage} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';
import {dbManager} from "../../src/database/DatabaseManager.js";

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
        it('should return questionId with closed question', (done) => {
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

        it('should return questionId with open question', (done) => {
            let newQuestionObj = {
                debateId: id,
                title: 'Does this test work ?',
                isOpenQuestion: true
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

    describe('getDebateDetails', () => {
        it('should give details on valid debate', (done) => {
            admin.emit('getDebateDetails', id, (details) => {
                details.should.not.equal(false);
                details.debateId.should.equal(id);
                should.exist(details.title);
                should.exist(details.description);
                done();
            });
        });

        it('should return false on invalid id', (done) => {
            admin.emit('getDebateDetails', 999, (details) => {
                details.should.equal(false);
                done();
            });
        });
    });

    describe('banDevice', () => {
        it('should ban existing device', async () => {
            let bannedClient = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    uuid: 'my-bannedclient-uuid'
                }
            });

            await new Promise(resolve => bannedClient.on('connect', resolve));

            let donePromise = new Promise(resolve => {
                bannedClient.on('banned', (banMessage) => {
                    banMessage.should.equal(ErrorMessage.BAN_MESSAGE);
                    bannedClient.close();
                    resolve();
                });
            });

            await new Promise(resolve => {
                admin.emit('banUser', {uuid: 'my-bannedclient-uuid', debateId: id}, (res) => {
                    res.should.equal(true);
                    resolve();
                });
            });

            await donePromise;
        });

        it('should not connect again', (done) => {
            let bannedClient = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    uuid: 'my-bannedclient-uuid'
                }
            });

            bannedClient.on('error', (err) => {
                err.should.equal(ErrorMessage.BLACKLISTED_DEVICE);
                bannedClient.close();
                done();
            });
        });
    });

    describe('unbanDevice', () => {
        it('should unban a banned device', async () => {
            await new Promise(resolve => {
                admin.emit('unbanUser', {uuid: 'my-bannedclient-uuid'}, (res) => {
                    res.should.equal(true);
                    resolve();
                });
            });

            let bannedClient = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    uuid: 'my-bannedclient-uuid'
                }
            });

            await new Promise(resolve => bannedClient.on('connect', resolve));
            bannedClient.close();
        });

        it('should connect again', (done) => {
            let bannedClient = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    uuid: 'my-bannedclient-uuid'
                }
            });

            bannedClient.on('connect', () => {
                bannedClient.close();
                done();
            });
        });
    });

    describe("closeDebate", () =>{
        it("Close debate", async () => {
            let idDebate = await dbManager.getLastDiscussionId();
            admin.emit("closeDebate", idDebate, async (status) => {
                status.should.equal(true);
                let debate = await dbManager.getDiscussion(idDebate);
                debate.hasOwnProperty('auditors').should.equal(true);
                debate.hasOwnProperty('finishTime').should.equal(true);
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
