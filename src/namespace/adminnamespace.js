import {logger, SocketConfig} from '../conf/config.js';
import {CustomNamespace} from './customnamespace.js'
import {Debate} from "../debate/debate.js";

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

            socket.on('newDebate', (callback) => {
                logger.info(`New debate creation requested from ${socket.username}`);

                // Create a new debate
                const debate = new Debate(socket, this.io, this.nsp);
                this.activeDebates.set(debate.debateID, debate);

                debate.startSocketHandling();
                callback(debate.debateID);
            });
        });
    }

    /**
     * Return a Debate with the corresponding id
     * @param id of the debate
     * @returns {Debate}
     */
    getActiveDebate(id) {
        if (!this.activeDebates.has(id))
            throw new Error(`Debate with id (${id}) not found.`);

        return this.activeDebates.get(id);
    }
}
