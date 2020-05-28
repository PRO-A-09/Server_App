import {SocketConfig, getProtocol} from '../../src/conf/config.js'
import {DebateManager} from "../../src/debatemanager.js";
import io from 'socket.io-client'
import chai from 'chai';
import {QuestionSuggestion} from "../../src/debate/questionsuggestion.js";

const expect = chai.expect;
const should = chai.should();

const SERVER_ADDRESS = `${getProtocol()}://${SocketConfig.TEST_SERVER_NAME}:${SocketConfig.SOCKET_PORT}`;
const PRIVILEGED_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.PRIVILEGED_NAMESPACE}`;
const DEBATE_NAMESPACE = `${SERVER_ADDRESS}${SocketConfig.DEBATE_NAMESPACE_PREFIX}`;

describe('Question suggestion class test', () => {
    let debateManager;

    let admin;
    let client;

    let id;
    let debate;

    let questionSuggestion;
    let suggestionId = 0;
    let uuid = 1000;

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

        let debateInfo = {
            title: 'My new debate',
            description: 'Test debate'
        };

        await new Promise(resolve => {
            admin.emit("newDebate", debateInfo, (debateID) => {
                id = debateID;
                debate = debateManager.nspAdmin.getActiveDebate(id);
                resolve();
            });
        });

        questionSuggestion = new QuestionSuggestion(debate, true);
    });

    beforeEach(async () => {
        // Connect the client to the debate first
        ++uuid;
        client = io.connect(`${DEBATE_NAMESPACE}${id}`, {
            path: SocketConfig.DEFAULT_PATH,
            forceNew: true,
            query: {
                uuid: `${uuid}`
            }
        });
        await new Promise(resolve => client.on('connect', resolve));

        suggestionId = questionSuggestion.newSuggestion(`${uuid}`, `Suggestion ${suggestionId + 1}`);
        suggestionId.should.not.equal(false);
    });

    it('should save suggestion', () => {
        let s = questionSuggestion.suggestedQuestions.get(suggestionId);
        s.question.should.equal(`Suggestion ${suggestionId}`);
    });

    describe('approveSuggestion', () => {
        it('should approve suggestion', () => {
            let res = questionSuggestion.approveSuggestion(suggestionId);
            res.should.equal(true);

            let s = questionSuggestion.approvedSuggestedQuestions.get(suggestionId);
            s.question.should.equal(`Suggestion ${suggestionId}`);
        });

        it('should not approve invalid suggestion', () => {
            let res = questionSuggestion.approveSuggestion(-1);
            res.should.equal(false);
        });
    });

    describe('rejectSuggestion', () => {
        it('should reject suggestion', () => {
            let res = questionSuggestion.rejectSuggestion(suggestionId);
            res.should.equal(true);

            questionSuggestion.suggestedQuestions.has(suggestionId).should.equal(false);
            questionSuggestion.approvedSuggestedQuestions.has(suggestionId).should.equal(false);
        });

        it('should not reject invalid suggestion', () => {
            let res = questionSuggestion.rejectSuggestion(-1);
            res.should.equal(false);
        });
    });

    describe('voteSuggestion', () => {
        let votingClient;
        const votingClientUUID = '34221345241331';

        before((done) => {
            votingClient = io.connect(`${DEBATE_NAMESPACE}${id}`, {
                path: SocketConfig.DEFAULT_PATH,
                forceNew: true,
                query: {
                    uuid: votingClientUUID
                }
            });
            votingClient.on('connect', done);
        });

        it('should vote for a suggestion', () => {
            let res = questionSuggestion.approveSuggestion(suggestionId);
            res.should.equal(true);

            res = questionSuggestion.voteSuggestion(suggestionId, votingClientUUID);
            res.should.equal(true);

            let s = questionSuggestion.approvedSuggestedQuestions.get(suggestionId);
            s.getNbVotes().should.equal(2); // 2 : because client who suggested it + us
        });

        it('should not vote more than once with same uuid', () => {
            let res = questionSuggestion.approveSuggestion(suggestionId);
            res.should.equal(true);

            res = questionSuggestion.voteSuggestion(suggestionId, votingClientUUID);
            res.should.equal(true);

            res = questionSuggestion.voteSuggestion(suggestionId, votingClientUUID);
            res.should.equal(false)

            let s = questionSuggestion.approvedSuggestedQuestions.get(suggestionId);
            s.getNbVotes().should.equal(2);
        });

        it('should not vote for a non-approved suggestion', () => {
            let res = questionSuggestion.voteSuggestion(suggestionId, votingClientUUID);
            res.should.equal(false);
        });

        it('should not vote for an invalid suggestion', () => {
            let res = questionSuggestion.voteSuggestion(-1, votingClientUUID);
            res.should.equal(false);
        });

        after(() => {
            votingClient.close();
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
