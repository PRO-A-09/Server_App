import {SocketConfig, logger} from '../conf/config.js';

/**
 * This class implements a new Debate and the communication with the clients.
 */
export class Debate {
    static nb_debate = 0;
    io;
    debateID;
    adminRoomName;
    userNamespace;
    questions;

    /**
     * Nested class Question that contains the question of the debate
     * @type {Debate.Question}
     */
    Question = class Question {
        static nb_question = 0;
        id;
        question;
        answers;

        constructor(question, answers) {
            this.id = ++Question.nb_question;
            this.question = question;
            this.answers = answers;
        }
    };

    /**
     * Create a new debate
     * @param ownerSocket socket of the debate creator
     * @param io Socket.io server
     */
    constructor(ownerSocket, io) {
        this.io = io;
        this.questions = new Map();
        this.debateID = ++Debate.nb_debate;
        this.adminRoomName = SocketConfig.ADMIN_ROOM_PREFIX + this.debateID;

        // Join the admin room
        ownerSocket.join(this.adminRoomName);

        // Create a new namespace for the debate
        this.userNamespace = io.of(SocketConfig.DEBATE_NAMESPACE_PREFIX + this.debateID);
    }

    /**
     * Starts handling for client events.
     */
    startSocketHandling() {
        this.userNamespace.on('connection', (socket) => {
            logger.debug(`New socket connected to namespace ${this.userNamespace.name} + ${socket.id}`);

            socket.on('getQuestions', (callback) => {
                logger.debug(`getQuestions received from ${socket.id}`);
                callback([ ...this.questions.values() ]);
            });
        });
    }

    /**
     * Register a new question to the debate and transmit it to the clients.
     * @param question object from the nested class Question
     */
    sendNewQuestion(question) {
        logger.debug(`Sending new question with id ${question.id}`);
        this.questions.set(question.id, question);
        this.userNamespace.emit('newQuestion', question);
    }
}
