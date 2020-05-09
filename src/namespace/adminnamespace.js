import {logger, SocketConfig} from '../conf/config.js';
import {CustomNamespace} from './customnamespace.js'
import {Debate} from "../debate/debate.js";
import {Statistic} from "../statistic/statistic.js";

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

            // Register socket functions
            socket.on('getDebates', this.getDebates(socket));
            socket.on('getDebateQuestions', this.getDebateQuestions(socket));
            socket.on('newDebate', this.newDebate(socket));
            socket.on('newQuestion', this.newQuestion(socket));
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

    // This section contains the different socket io functions

    /**
     * Return the list of available debates to the callback function
     */
    getDebates = (socket) => (callback) => {
        logger.debug(`Get debate requested from ${socket.username}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        // TODO: Only return debates available for this user

        let debates = Array.from(this.activeDebates.values(), d => ({
            debateId: d.debateID,
            title: d.title,
            description: d.description
        }));

        callback(debates);
    };

    /**
     * Return the list of questions for a debate to the callback function
     * debateId contains the id of the debate
     */
    getDebateQuestions = (socket) => (debateId, callback) => {
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

        callback(Array.from(debate.questions.values(), q => (q.format())));
    };

    /**
     * Create a new debate
     * newDebateObj contains the information of the debate (title, description)
     */
    newDebate = (socket) => (newDebateObj, callback) => {
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

        debate.startSocketHandling();
        callback(debate.debateID);
    };

    /**
     * Add a new question to the specified debate
     * newQuestionObj contains the required information (debateId, title, answers)
     */
    newQuestion = (socket) => (newQuestionObj, callback) => {
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
        debate.sendNewQuestion(question);
        callback(question.id);
    };
}
