import {logger, SocketConfig, DebateConfig, ErrorMessage} from '../conf/config.js';
import {CustomNamespace} from './customnamespace.js'
import {Debate} from "../debate/debate.js";
import {Statistic} from "../statistic/statistic.js";
import {dbManager} from "../database/DatabaseManager.js";
import * as TypeCheck from '../utils/typecheck.js'

/**
 * This class implements an PrivilegedNamespace that extends a CustomNamespace
 */
export class PrivilegedNamespace extends CustomNamespace {
    io;
    activeDebates;
    users;
    statistic;

    /**
     * Default constructor that saves the socket.io Namespace
     * @param io Socket.io server
     */
    constructor(io) {
        super(io.of(SocketConfig.PRIVILEGED_NAMESPACE));
        this.io = io;
        this.activeDebates = new Map();
        this.users = new Map();
        this.statistic = new Statistic();
    }

    /**
     * Starts handling for events.
     */
    startSocketHandling() {
        this.nsp.on('connection', (socket) => {
            logger.debug(`New connected socket (socketid: ${socket.id}, username: ${socket.username})`);

            // Initialize the
            this.initializeUsers(socket);

            // Register socket functions
            socket.on('getDebates', this.getDebates(socket));
            socket.on('getDebateDetails', this.getDebateDetails(socket));
            socket.on('getDebateQuestions', this.getDebateQuestions(socket));
            socket.on('getDebateSuggestions', this.getDebateSuggestions(socket));
            socket.on('newDebate', this.newDebate(socket));
            socket.on('closeDebate', this.closeDebate(socket));
            socket.on('newQuestion', this.newQuestion(socket));
            socket.on('getAdminStats', this.getAdminStats(socket));
            socket.on('getDebateStats', this.getDebateStats(socket));
            socket.on('getQuestionStats', this.getQuestionStats(socket));

            // Moderator functions
            socket.on('banUser', this.banUser(socket));
            socket.on('unbanUser', this.unbanUser(socket));

            socket.on('approveQuestion', this.approveQuestion(socket));
            socket.on('rejectQuestion', this.rejectQuestion(socket));
        });
    }

    /**
     * Initialize the user and his attributes
     * @param socket privileged socket to initialize
     */
    initializeUsers(socket) {
        if (this.users.has(socket.username)) {
            logger.debug(`Existing user username (${socket.username})`)
            this.users.get(socket.username).socket = socket;
        } else {
            logger.debug(`New user username (${socket.username})`)
            // Store the socket and initialize attributes
            this.users.set(socket.username, {
                socket: socket,
                activeDebates: new Set()
            });
        }
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
     * Return the list of all debates to the callback function
     */
    getDebates = (socket) => async (callback) => {
        logger.debug(`Get debate requested from ${socket.username}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let debates = [];
        for (let debateId of this.users.get(socket.username).activeDebates) {
            let d = this.activeDebates.get(debateId);
            debates.push({
                debateId: d.debateID,
                title: d.title,
                description: d.description,
                closed: false
            });
        }

        logger.debug('Getting discussions from database');
        let discussions = await dbManager.getDiscussionsAdmin(socket.username);
        for (const discussion of discussions) {
            debates.push({
                debateId: discussion._id,
                title: discussion.title,
                description: discussion.description,
                closed: discussion.finishTime != null
            });
        }

        callback(debates);
    };

    /**
     * Return the details of the debate with the specified id
     * debateId contains the id of the debate
     */
    getDebateDetails = (socket) => async (debateId, callback) => {
        logger.debug(`getDebateDetails received from user (${socket.username}) id (${socket.id})`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        if (!TypeCheck.isInteger(debateId)) {
            logger.debug('Invalid arguments for getDebateDetails.');
            callback(false);
            return;
        }

        const debate = this.getActiveDebate(debateId);
        if (debate == null) { // Try to query from DB
            logger.debug(`Debate with id (${debateId}) not found... Checking in database.`);

            const adminId = await dbManager.getAdminId(socket.username);
            const discussion = await dbManager.getDiscussion(debateId);
            if (discussion == null) {
                logger.debug(`Discussion with id (${debateId}) not found`);
                callback(false);
                return
            }

            if (!discussion.administrator.equals(adminId)) {
                logger.debug(`Cannot get the debate information of another user.`);
                callback(false);
                return;
            }

            let details = {
                debateId: discussion._id,
                title: discussion.title,
                description: discussion.description,
                startTime: discussion.startTime,
                finishTime: discussion.finishTime
            }

            callback(details);
        } else {
            // Store details in an object before sending it
            let details = {
                debateId: debate.debateID,
                title: debate.title,
                description: debate.description,
                startTime: debate.startTime
            }

            callback(details);
        }
    }

    /**
     * Return the list of questions for a debate to the callback function
     * debateId contains the id of the debate
     */
    getDebateQuestions = (socket) => (debateId, callback) => {
        logger.info(`getDebateQuestions requested from ${socket.username}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        if (!TypeCheck.isInteger(debateId)) {
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
     * Return the list of suggestions for a debate to the callback function
     * debateId contains the id of the debate
     */
    getDebateSuggestions = (socket) => (debateId, callback) => {
        logger.info(`getDebateSuggestions requested from ${socket.username}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        if (!TypeCheck.isInteger(debateId)) {
            logger.debug('Invalid arguments for getDebateSuggestions.');
            callback(-1);
            return;
        }

        const debate = this.getActiveDebate(debateId);
        if (debate == null) {
            logger.debug(`Debate with id (${debateId}) not found.`);
            callback(-1);
            return;
        }

        callback(debate.questionSuggestion.getApprovedSuggestions());
    };

    /**
     * Create a new debate
     * newDebateObj contains the information of the debate (title, description)
     */
    newDebate = (socket) => async (newDebateObj, callback) => {
        logger.info(`New debate creation requested from ${socket.username}`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        const title = newDebateObj.title;
        const description = newDebateObj.description;
        if (!TypeCheck.isString(title, DebateConfig.MAX_TITLE_LENGTH) ||
            !TypeCheck.isString(description, DebateConfig.MAX_DESCRIPTION_LENGTH)) {
            logger.debug('Invalid arguments for newDebate.');
            callback(-1);
            return;
        }

        // Create and start a new debate
        const debate = new Debate(title, description, socket, this.io, this.nsp);
        this.activeDebates.set(debate.debateID, debate);
        this.users.get(socket.username).activeDebates.add(debate.debateID);
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
    };

    /**
     * Return the true if the debate was closed correctly false otherwise in the callback function
     */
    closeDebate = (socket) => async (aIdDiscussion, callback) => {
        logger.debug(`Close debate requested from ${socket.username}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        // Get the debate with the desired id
        let debate = this.getActiveDebate(aIdDiscussion);
        logger.debug(`Debate given ${debate}`);
        // If the debate does not exist it cannot be closed
        if(debate == null){
            callback(false);
            logger.debug(`No active debate with the id ${aIdDiscussion} was found`);
            return;
        }
        // Delete debate from active debates
        this.activeDebates.delete(aIdDiscussion);
        this.users.get(socket.username).activeDebates.delete(debate.debateID);
        // Save in the database that the discussion is closed
        let update = await dbManager.saveEndDiscussion(aIdDiscussion);

        logger.debug(`result update: ${update}`);

        callback(update);
    };

    /**
     * Add a new question to the specified debate
     * newQuestionObj contains the required information (debateId, title, answers, (optional) isOpenQuestion)
     */
    newQuestion = (socket) => async (newQuestionObj, callback) => {
        logger.debug(`newQuestion received from user (${socket.username}), id(${socket.id})`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        const debateId = newQuestionObj.debateId;
        const title = newQuestionObj.title;
        let answers = newQuestionObj.answers;
        let isOpenQuestion = newQuestionObj.isOpenQuestion;

        // Check if this is an open question, if this is an open question, ignore answers
        if (!TypeCheck.isBoolean(isOpenQuestion)) {
            isOpenQuestion = false;
        } else if (isOpenQuestion === true) {
            answers = [];
        }

        // Check debateId, title, answers
        if (!TypeCheck.isInteger(debateId) || !TypeCheck.isString(title) ||
            !TypeCheck.isArrayOf(answers, TypeCheck.isString, DebateConfig.MAX_CLOSED_ANSWERS)) {
            logger.debug('Invalid arguments for newQuestion.');
            callback(-1);
            return;
        }

        const debate = this.getActiveDebate(debateId);
        if (debate == null) {
            logger.debug(`Debate with id (${debateId}) not found.`);
            callback(-1);
            return;
        }

        const question = new debate.Question(title, answers, isOpenQuestion);

        await debate.sendNewQuestion(question);
        callback(question.id);
    };

    /**
     * Return an array that contains stats for the debates of an admin in the result of the callback function
     */
    getAdminStats = (socket) => async (callback) => {
        logger.debug(`getAdminStats received from ${socket.id}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        // Ask for the stats for an admin user in the statistic class
        let allDiscussions = await this.statistic.adminStats(socket.username);

        if (allDiscussions.length !== 2) {
            logger.debug('Invalid username.');
            callback([]);
            return;
        }

        callback([allDiscussions[0], allDiscussions[1]]);
    };

    /**
     * Return an array that contains stats for a specific debate in the result of the callback function
     */
    getDebateStats = (socket) => async (debateId, callback) => {
        logger.debug(`getDebatStats received from ${socket.id}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let allQuestions = await this.statistic.debateStats(debateId, this.activeDebates);

        if (allQuestions.length !== 3) {
            logger.debug('Invalid debate.');
            callback([]);
            return;
        }

        callback([allQuestions[0], allQuestions[1], allQuestions[2]]);
    };

    /**
     * Return an array that contains stats for a specific question in the result of the callback function
     */
    getQuestionStats = (socket) => async (questionId, callback) => {
        logger.debug(`getQuestionStats received from ${socket.id}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let allResponses = await this.statistic.questionStats(questionId[0], questionId[1], this.activeDebates);

        if (allResponses.length !== 3) {
            logger.debug('Invalid question.');
            callback([]);
            return;
        }

        console.log(allResponses);

        callback([allResponses[0], allResponses[1], allResponses[2]]);

    };

    /**
     * Ban a user from all admin future debates and kick him immediately if debateId is specified
     * banObj contains the required information (uuid and (optional) debateId)
     */
    banUser = (socket) => async (banObj, callback) => {
        logger.debug(`banUser received from user (${socket.username}), id(${socket.id})`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let {uuid, debateId} = banObj;
        let shouldKick = false;
        if (debateId != null) {
            shouldKick = true;
        }

        if (!TypeCheck.isString(uuid) || (shouldKick && !TypeCheck.isInteger(debateId))) {
            logger.debug(`Invalid arguments for banUser. Uuid: ${uuid}, debateId: ${debateId}`);
            callback(false);
            return;
        }

        let debate;
        if (shouldKick) {
            debate = this.getActiveDebate(debateId);
            if (debate == null) {
                logger.warn(`Debate with id (${debateId}) not found. Can't ban properly.`);
                callback(false);
                return;
            }
        }

        // Ban the device in the database
        let res = await dbManager.banDevice(uuid, socket.username);
        if (res === false) { // A ban should always work.. We add an uuid to the database if not found.
            logger.error(`Cannot ban device with uuid ${uuid}`);
            callback(false);
            return;
        }

        if (shouldKick) {
            // Disconnect the client
            let client = debate.getClient(uuid);
            if (client == null) {
                logger.debug(`Client with uuid (${uuid}) is not connected`)
            } else {
                // Inform the client he is banned
                client.socket.emit('banned', ErrorMessage.BAN_MESSAGE);
                client.socket.disconnect();
            }
        }

        logger.info(`User (${socket.username}) banned the device with uuid ${uuid}`);
        callback(true);
    };

    /**
     * Unban a user from all admin future debates
     * unbanObj contains the required information (uuid)
     */
    unbanUser = (socket) => async (unbanObj, callback) => {
        logger.debug(`unbanUser received from user (${socket.username}), id(${socket.id})`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let {uuid} = unbanObj;
        if (!TypeCheck.isString(uuid)) {
            logger.debug('Invalid arguments for unbanUser');
            callback(false);
            return;
        }

        // Check if the device is banned by this user
        let isBanned = await dbManager.isDeviceBanned(uuid, socket.username);
        if (!isBanned) {
            logger.info(`Device with uuid (${uuid}) is not banned`);
            callback(true);
            return;
        }

        // Ban the device in the database
        let res = await dbManager.unbanDevice(uuid, socket.username);
        if (res === false) { // We know the device exists and was banned by this specific user...
            logger.error(`Couldn't unban device with uuid ${uuid}`);
            callback(false);
            return;
        }

        logger.info(`User (${socket.username}) unbanned the device with uuid ${uuid}`);
        callback(true);
    };

    /**
     * Approve a suggestion with the specified id and debate
     * approveObj contains the required information (debateId and suggestionId)
     */
    approveQuestion = (socket) => (approveObj, callback) => {
        logger.debug(`approveQuestion received from user (${socket.username}), id(${socket.id})`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let {debateId, suggestionId} = approveObj;
        if (!TypeCheck.isInteger(suggestionId) || !TypeCheck.isInteger(debateId)) {
            logger.debug('Invalid arguments for approveSuggestion');
            callback(false);
            return;
        }

        const debate = this.getActiveDebate(debateId);
        if (debate == null) {
            logger.debug(`Debate with id (${debateId}) not found.`);
            callback(false);
            return;
        }

        const res = debate.questionSuggestion.approveSuggestion(suggestionId);
        if (res === false) {
            logger.debug('Cannot approve suggestion.');
            callback(false);
            return;
        }

        logger.info(`User (${socket.username}) approved suggestion with id (${suggestionId})`);
        callback(true);
    };

    /**
     * Reject a suggestion with the specified id and debate
     * rejectObj contains the required information (debateId and suggestionId)
     */
    rejectQuestion = (socket) => (rejectObj, callback) => {
        logger.debug(`rejectQuestion received from user (${socket.username}), id(${socket.id})`);

        if (!TypeCheck.isFunction(callback)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let {debateId, suggestionId} = rejectObj;
        if (!TypeCheck.isInteger(suggestionId) || !TypeCheck.isInteger(debateId)) {
            logger.debug('Invalid arguments for rejectQuestion');
            callback(false);
            return;
        }

        const debate = this.getActiveDebate(debateId);
        if (debate == null) {
            logger.debug(`Debate with id (${debateId}) not found.`);
            callback(false);
            return;
        }

        const res = debate.questionSuggestion.rejectSuggestion(suggestionId);
        if (res === false) {
            logger.debug('Cannot reject suggestion.');
            callback(false);
            return;
        }

        logger.info(`User (${socket.username}) rejected suggestion with id (${suggestionId})`);
        callback(true);
    }
}
