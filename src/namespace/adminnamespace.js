import {logger, SocketConfig} from '../conf/config.js';
import {CustomNamespace} from './customnamespace.js'
import {Debate} from "../debate/debate.js";
import {dbManager} from "../database/DatabaseManager.js";

/**
 * This class implements an AdminNamespace that extends a CustomNamespace
 */
export class AdminNamespace extends CustomNamespace {
    io;
    activeDebates;

    /**
     * Default constructor that saves the socket.io Namespace
     * @param io Socket.io server
     */
    constructor(io) {
        super(io.of(SocketConfig.ADMIN_NAMESPACE));
        this.io = io;
        this.activeDebates = new Map();
    }

    /**
     * Starts handling for events.
     */
    startSocketHandling() {
        this.nsp.on('connection', (socket) => {
            logger.debug(`New connected socket (socketid: ${socket.id}, username: ${socket.username})`);

            socket.on('getDebates', (callback) => {
                logger.debug(`Get debate requested from ${socket.username}`);

                if (!(callback instanceof Function)) {
                    logger.debug(`callback is not a function.`);
                    return;
                }

                // TODO: Only return debates available for this user

                let debates = [];
                for (const [key, debate] of this.activeDebates.entries()) {
                    debates.push({
                        debateId: debate.debateID,
                        title: debate.title,
                        description: debate.description
                    });
                }

                callback(debates);
            });

            socket.on('getDebateQuestions', (debateId, callback) => {
                logger.info(`getDebateQuestions requested from ${socket.username}`);

                if (!(callback instanceof Function)) {
                    logger.debug(`callback is not a function.`);
                    return;
                }

                if (debateId == null) {
                    logger.debug('Invalid arguments for getQuestions.');
                    callback(-1);
                    return;
                }

                const debate = this.getActiveDebate(debateId);
                if (debate == null) {
                    logger.debug(`Debate with id (${debateId}) not found.`);
                    callback(-1);
                    return;
                }

                callback([ ...debate.questions.values() ]);
            });

            socket.on('newDebate', async (newDebateObj, callback) => {
                logger.info(`New debate creation requested from ${socket.username}`);

                if (!(callback instanceof Function)) {
                    logger.debug(`callback is not a function.`);
                    return;
                }

                const title = newDebateObj.title;
                const description = newDebateObj.description;
                if (!title || !description) {
                    logger.debug('Invalid arguments for newDebate.');
                    callback(-1);
                    return;
                }

                //TODO: Check title & description are valid strings

                // Create and start a new debate
                const debate = new Debate(title, description, socket, this.io, this.nsp);
                this.activeDebates.set(debate.debateID, debate);
                await dbManager.saveDiscussion(debate)
                    .then(res => {
                        if (res === true) {
                            logger.info('Debate saved to db');
                        } else {
                            logger.warn('Cannot save debate to db');
                        }
                    })
                    .catch(res => {
                        logger.error(`saveDiscussion threw : ${res}.`)
                    });

                debate.startSocketHandling();
                callback(debate.debateID);
            });

            socket.on('newQuestion', async (newQuestionObj, callback) => {
                logger.debug(`newQuestion received from user (${socket.username}), id(${socket.id})`);

                if (!(callback instanceof Function)) {
                    logger.debug(`callback is not a function.`);
                    return;
                }

                const debateId = newQuestionObj.debateId;
                const title = newQuestionObj.title;
                const answers = newQuestionObj.answers;
                // Check debateId, title, answers
                if (!debateId || !title || !answers) {
                    logger.debug('Invalid arguments for newQuestion.');
                    callback(-1);
                    return;
                }

                //TODO: Check title is string, answers are string

                const debate = this.getActiveDebate(debateId);
                if (debate == null) {
                    logger.debug(`Debate with id (${debateId}) not found.`);
                    callback(-1);
                    return;
                }

                const question = new debate.Question(title, answers);
                await dbManager.saveQuestion(question, debateId)
                    .then(res => {
                        if (res === true) {
                            logger.info('Question saved to db');
                        } else {
                            logger.warn('Cannot save question to db');
                        }
                    })
                    .catch(res => {
                        logger.error(`saveQuestion threw : ${res}.`)
                    });

                debate.sendNewQuestion(question);
                callback(question.id);
            });
        });
    }

    /**
     * Return a Debate with the corresponding id
     * @param id of the debate
     * @returns {Debate}
     */
    getActiveDebate(id) {
        // Return null if not found
        return this.activeDebates.get(id);
    }
}
