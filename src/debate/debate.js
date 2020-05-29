import {SocketConfig, logger, DebateConfig} from '../conf/config.js';
import * as TypeCheck from '../utils/typecheck.js'
import {dbManager} from "../database/DatabaseManager.js";
import {ClientBlacklistMiddleware} from "../middleware/clientblacklistmiddleware.js";
import {QuestionSuggestion} from "./questionsuggestion.js";

/**
 * This class implements a new Debate and the communication with the clients.
 */
export class Debate {
    static nb_debate = 0;

    // Debate information
    debateID;
    title;
    description;
    locked;

    // Admin information
    adminRoomName;
    adminRoom;
    adminId;
    admin;

    // User information
    userNamespace;
    clients;

    // User data
    questions;
    questionSuggestion

    /**
     * Nested class Question that contains the question of the debate
     * @type {Debate.Question}
     */
    Question = class Question {
        static nb_question = 0;
        id;
        title;
        answers;
        isOpenQuestion;

        constructor(title, answers, isOpenQuestion = false) {
            this.id = ++Question.nb_question;
            this.title = title;
            this.isOpenQuestion = isOpenQuestion;

            if (answers == null) {
                this.answers = [];
            } else {
                if (isOpenQuestion) {
                    this.answers = answers.map(a => ({uuid: a.uuid, answer: a.answer}));
                } else {
                    this.answers = answers.map(a => ({answer: a}));
                }
            }
        }

        /**
         * Return the answer text
         * @param answerId id of the answer
         * @returns {string} text of the answer
         */
        getAnswer(answerId) {
            return this.answers[answerId].answer;
        }

        /**
         * Format the question by sending only answers
         * @returns {{answers: String[], id: int, isOpenQuestion: boolean, title: String}}
         */
        format() {
            return {
                id: this.id,
                title: this.title,
                answers: this.answers.map(a => (a.answer)),
                isOpenQuestion: this.isOpenQuestion
            }
        }
    };

    /**
     * Create a new debate
     * @param title of the debate
     * @param description of the debate
     * @param ownerSocket socket of the debate creator
     * @param io Socket.io server
     * @param adminNamespace admin namespace to create the room communicate with the admins
     */
    constructor(title, description, ownerSocket, io, adminNamespace) {
        // Initialize details
        this.title = title;
        this.description = description;
        this.debateID = ++Debate.nb_debate;
        this.locked = false;

        // Initialize data
        this.clients = new Map();
        this.questions = new Map();
        this.questionSuggestion = new QuestionSuggestion(this, false);

        // Initialize admin settings
        this.adminRoomName = SocketConfig.ADMIN_ROOM_PREFIX + this.debateID;
        this.adminRoom = adminNamespace.to(this.adminRoomName);
        this.admin = ownerSocket.username;
        this.adminId = ownerSocket.userid;

        // Join the admin room
        ownerSocket.join(this.adminRoomName);

        // Create a new namespace for the debate
        this.userNamespace = io.of(SocketConfig.DEBATE_NAMESPACE_PREFIX + this.debateID);
        this.userNamespace.use(new ClientBlacklistMiddleware(this).middlewareFunction);
    }

    /**
     * Close the debate and disconnect all clients
     * @param io
     */
    close(io) {
        logger.info(`Closing debate with id (${this.debateID})`);
        this.lockDebate();

        logger.debug(`Disconnecting clients...`);
        for (let [uuid, client] of this.clients) {
            client.socket.disconnect(true);
        }

        logger.debug('Removing listeners...');
        this.userNamespace.removeAllListeners();

        logger.debug('Deleting namespace reference...');
        delete io.nsps[`${SocketConfig.DEBATE_NAMESPACE_PREFIX}${this.debateID}`];

        logger.info('Debate has been closed.');
    }

    /**
     * Starts handling for client events.
     */
    startSocketHandling() {
        this.userNamespace.on('connection', async (socket) => {
            logger.debug(`New socket connected to namespace (${this.userNamespace.name}) id (${socket.id})`);
            this.initializeClient(socket);

            // Register socket functions
            socket.on('getDebateDetails', this.getDebateDetails(socket));
            socket.on('getQuestions', this.getQuestions(socket));
            socket.on('answerQuestion', this.answerQuestion(socket));
            socket.on('answerOpenQuestion', this.answerOpenQuestion(socket));
            socket.on('getSuggestedQuestions', this.getSuggestedQuestions(socket));
            socket.on('suggestQuestion', this.suggestQuestion(socket));
            socket.on('voteSuggestedQuestion', this.voteSuggestedQuestion(socket));
        });
    }

    /**
     * Lock the debate by blocking all new connections
     */
    lockDebate() {
        logger.info(`Debate with id (${this.debateID}) is now locked.`);
        this.locked = true;
    }

    /**
     * Unlock the debate by allowing all new connections
     */
    unlockDebate() {
        logger.info(`Debate with id (${this.debateID}) is now unlocked.`);
        this.locked = false;
    }

    /**
     * Initialize the client and his attributes
     * @param socket client socket to initialize
     */
    initializeClient(socket) {
        if (this.clients.has(socket.uuid)) {
            logger.debug(`Existing client uuid (${socket.uuid})`)
            this.getClient(socket.uuid).socket = socket;
        } else {
            logger.debug(`New client uuid (${socket.uuid})`);

            // Store the socket and initialize attributes
            this.clients.set(socket.uuid, {
                socket: socket,
                answers: new Map(),
                suggestions: new Set()
            });

            dbManager.trySaveDevice(socket.uuid)
                .then(res => {
                    if (res === true) {
                        logger.info('Device saved to db');
                    } else {
                        logger.warn('Cannot save device to db');
                    }
                })
                .catch(res => {
                    logger.error(`saveDevice threw : ${res}.`)
                });
        }
    }

    /**
     * Register a new question to the debate and transmit it to the clients.
     * @param question object from the nested class Question
     */
    async sendNewQuestion(question) {
        await dbManager.saveQuestionAdmin(question, this.debateID, this.admin)
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

        logger.debug(`Sending new question with id ${question.id}`);
        this.questions.set(question.id, question);
        this.userNamespace.emit('newQuestion', question.format());
        this.adminRoom.emit('newQuestion');
    }

    /**
     * This function return the number of unique clients that connected to the debate
     * @returns {Number} number of unique clients that connected to the debate
     */
    getNbUniqueClients() {
        return this.clients.size;
    }

    /**
     * Return a client based on the uuid
     * @param uuid uuid of the client
     * @returns {*} client
     */
    getClient(uuid) {
        return this.clients.get(uuid);
    }

    // This section contains the different socket io functions

    /**
     * Return the details of the debate
     */
    getDebateDetails = (socket) => (callback) => {
        logger.debug(`getDebateDetails received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        // Store details in an object before sending it
        let details = {
            debateId: this.debateID,
            title: this.title,
            description: this.description
        }

        callback(details);
    }

    /**
     * Return the list of questions to the callback function
     */
    getQuestions = (socket) => (callback) => {
        logger.debug(`getQuestions received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        // Mark the question that were answered
        const questions = Array.from(this.questions.values(), q => (q.format()));
        for (let [questionId, answerId] of this.getClient(socket.uuid).answers) {
            try {
                questions[questionId - 1].answered = true;
            } catch {
                logger.error(`Question ID (${questionId - 1}) not found in questions list`);
            }
        }

        // Format the questions before sending them
        callback(questions);
    };

    /**
     * Register a new answer to a question of the debate.
     * questionAnswer contains questionId and answerId
     * callback is a function that takes true on success, otherwise false.
     */
    answerQuestion = (socket) => async (questionAnswer, callback) => {
        logger.debug(`answerQuestion received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        const questionId = questionAnswer.questionId;
        const answerId = questionAnswer.answerId;
        if (!TypeCheck.isInteger(questionId) || !TypeCheck.isInteger(answerId)) {
            logger.debug("questionId or answerId is null.");
            callback(false);
            return;
        }

        const question = this.questions.get(questionId);
        if (question == null) {
            logger.debug(`Question with id (${questionId}) not found.`);
            callback(false);
            return;
        }

        if (question.isOpenQuestion) {
            logger.debug(`Question with id (${questionId}) is an open question and not a closed question.`);
            callback(false);
            return;
        }

        if (this.getClient(socket.uuid).answers.has(questionId)) {
            logger.debug(`Client with uuid (${socket.uuid}) already answered.`);
            callback(false);
            return;
        }

        if (answerId >= question.answers.length) {
            logger.debug(`Question (${questionId}) with answer (${answerId}) invalid.`);
            callback(false);
            return;
        }

        await dbManager.saveResponseDevice(socket.uuid, answerId, questionId, this.debateID)
            .then(res => {
                if (res === true) {
                    logger.info('Device response saved to db');
                } else {
                    logger.warn('Cannot save device response to db');
                }
            })
            .catch(res => {
                logger.error(`saveResponseDevice threw : ${res}.`)
            });

        logger.info(`Socket (${socket.id}) replied ${answerId} to question (${questionId}).`);
        this.getClient(socket.uuid).answers.set(questionId, answerId);

        // Send the reply to the admin room.
        this.adminRoom.emit('questionAnswered', {debateId: this.debateID, questionId: questionId, answerId: answerId});
        callback(true);
    };

    /**
     * Register a new answer to an open question of the debate.
     * questionAnswer contains questionId and the answer
     * callback is a function that takes true on success, otherwise false.
     */
    answerOpenQuestion = (socket) => async (questionAnswer, callback) => {
        logger.debug(`answerOpenQuestion received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        const questionId = questionAnswer.questionId;
        const answer = questionAnswer.answer;
        if (!TypeCheck.isInteger(questionId) ||
            !TypeCheck.isString(answer, DebateConfig.MAX_OPEN_ANSWER_LENGTH)) {
            logger.debug("questionId or answer is null.");
            callback(false);
            return;
        }

        const question = this.questions.get(questionId);
        if (question == null) {
            logger.debug(`Question with id (${questionId}) not found.`);
            callback(false);
            return;
        }

        if (!question.isOpenQuestion) {
            logger.debug(`Question with id (${questionId}) is not an open question.`);
            callback(false);
            return;
        }

        if (this.getClient(socket.uuid).answers.has(questionId)) {
            logger.debug(`Client with uuid (${socket.uuid}) already answered.`);
            callback(false);
            return;
        }

        let newLength = question.answers.push({answer: answer, uuid: socket.uuid});
        let responseId = newLength - 1;
        this.getClient(socket.uuid).answers.set(questionId, responseId);

        await dbManager.saveResponse(responseId, answer, questionId, this.debateID, socket.uuid)
            .then(res => {
                if (res === true) {
                    logger.info('Response saved to db');
                } else {
                    logger.warn('Cannot save response to db');
                }
            })
            .catch(res => {
                logger.error(`saveResponse threw : ${res}.`)
            });

        logger.info(`Socket (${socket.id}) replied (${answer}) to question (${questionId}).`);
        this.adminRoom.emit('newOpenQuestionAnswer', {questionId: questionId, responseId, uuid: socket.uuid});
        callback(true);
    };

    /**
     * Returns the list of suggested questions.
     * callback is a function that takes an array of suggestions.
     */
    getSuggestedQuestions = (socket) => (callback) => {
        logger.debug(`getSuggestedQuestions received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        callback(this.questionSuggestion.getApprovedSuggestions(socket.uuid));
    };

    /**
     * Suggest a new question to the participants of the debate.
     * question is a String that contains the question
     * callback is a function that takes the id of the suggestion on success, otherwise false.
     */
    suggestQuestion = (socket) => (question, callback) => {
        logger.debug(`suggestQuestion received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let suggestionId = this.questionSuggestion.newSuggestion(socket.uuid, question);
        if (suggestionId === false) {
            logger.debug('Cannot create suggestion.');
            callback(false);
            return;
        }

        logger.info(`Socket (${socket.id}) suggested (${question}).`);
        callback(suggestionId);
    };

    /**
     * Vote for a suggested question.
     * suggestionId is the id of the suggestion to vote for
     * callback is a function that takes true on success, otherwise false.
     */
    voteSuggestedQuestion = (socket) => (suggestionId, callback) => {
        logger.debug(`voteSuggestedQuestion received from ${socket.id}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        if (!TypeCheck.isInteger(suggestionId)) {
            logger.debug('Invalid arguments for voteSuggestedQuestion');
            callback(false);
            return;
        }

        let res = this.questionSuggestion.voteSuggestion(suggestionId, socket.uuid);
        if (res === false) {
            logger.debug(`Cannot vote for suggestion with id (${suggestionId})`);
            callback(false);
            return;
        }

        logger.info(`Socket (${socket.id}) voted for suggestion id (${suggestionId})`);
        callback(true);
    };
}
