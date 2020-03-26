import {logger} from '../conf/config.js';
import {CustomNamespace} from './customnamespace.js'

/**
 * This class implements an AdminNamespace that extends a CustomNamespace
 */
export class AdminNamespace extends CustomNamespace {
    /**
     * Default constructor that saves the socket.io Namespace
     * @param nsp socket.io Namespace
     */
    constructor(nsp) {
        super(nsp);
    }

    /**
     * Starts handling for events.
     */
    startSocketHandling() {
        this.nsp.on('connection', this.onConnection);
    }

    /**
     * Function that handles the new socket connection.
     * @param socket new connected socket.
     */
    onConnection(socket) {
        logger.debug(`New connected socket (socketid: ${socket.id}, username: ${socket.username})`);

        socket.on('disconnect', _ => {
            logger.debug(`socket (${socket.id}) disconnected`);
        });
    }
}
