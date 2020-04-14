import {SocketConfig, logger} from '../conf/config.js';

/**
 * This class implements a new Debate and the communication with the clients.
 */
export class Debate {
    static nb_debate = 0;
    debateID;
    adminRoomName;
    userNamespace;

    /**
     * Create a new debate
     * @param ownerSocket socket of the debate creator
     * @param io Socket.io server
     */
    constructor(ownerSocket, io) {
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
            logger.debug(`New socket connected to namespace ${this.userNamespace.name}`)
        });
    }
}
