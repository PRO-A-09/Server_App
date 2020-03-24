import {SocketConfig, logger} from './conf.js';
import {CustomNamespace} from './customnamespace.js'

export class AdminNamespace extends CustomNamespace {
    constructor(nsp) {
        super(nsp);
    }

    startSocketHandling() {
        this.nsp.on('connection', this.onConnection);
    }

    onConnection(socket) {
        logger.debug(`New connected socket (socketid: ${socket.id}, username: ${socket.username})`);

        socket.on('newDebate', (callback) => {
            logger.info(`New debate creation requested from ${socket.username}`);
            /* Generate debate id */
            const idDebate = '1';
            socket.join(`${SocketConfig.ADMIN_ROOM_PREFIX}-${idDebate}`);
            callback(idDebate);
        });

        socket.on('disconnect', _ => {
            logger.debug(`socket (${socket.id}) disconnected`);
        });
    }
}
