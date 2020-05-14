import {SocketConfig, logger, ErrorMessage} from '../conf/config.js'

/**
 * Class implementing a Middleware function with a fixed password
 */
export class ClientBlacklistMiddleware {
    /**
     * This function checks the uuid of the device and compare it to a blacklist
     * @param socket socket attempting a connection
     * @param next middleware function
     * @returns {*} the result returned by the next middleware
     */
    middlewareFunction(socket, next) {
        logger.debug('New ClientBlacklistMiddleware connection');

        const uuid = socket.handshake.query.uuid;
        if (!uuid) {
            logger.debug(`socket (${socket.id}) did not specify uuid.`)
            return next(new Error(ErrorMessage.UNSPECIFIED_UUID));
        }

        // TODO: - Try to find uuid in blacklist database
        //       - Drop connection if found
        if (true) {
            logger.debug(`socket (${socket.id}) with uuid (${uuid}) connected`);
            socket.uuid = uuid;
            return next();
        }

        logger.info(`socket (${socket.id}) with uuid (${uuid}) is blacklisted.`);
        return next(new Error(ErrorMessage.BLACKLISTED_DEVICE));
    }
}
