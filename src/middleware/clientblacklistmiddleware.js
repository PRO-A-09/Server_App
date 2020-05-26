import {SocketConfig, logger, ErrorMessage} from '../conf/config.js'
import {dbManager} from "../database/DatabaseManager.js";

/**
 * Class implementing a Middleware function with a fixed password
 */
export class ClientBlacklistMiddleware {
    user;

    /**
     * Constructor of ClientBlacklistMiddleware that sets the username
     * @param user name of the user who owns the middleware
     */
    constructor(user) {
        this.user = user;
    }

    /**
     * This function checks the uuid of the device and compare it to a blacklist
     * @param socket socket attempting a connection
     * @param next middleware function
     * @returns {*} the result returned by the next middleware
     */
    middlewareFunction = async (socket, next) => {
        logger.debug('New ClientBlacklistMiddleware connection');

        const uuid = socket.handshake.query.uuid;
        if (!uuid) {
            logger.debug(`socket (${socket.id}) did not specify uuid.`)
            return next(new Error(ErrorMessage.UNSPECIFIED_UUID));
        }

        let isBanned = await dbManager.isDeviceBanned(uuid, this.user);
        if (!isBanned) {
            logger.debug(`socket (${socket.id}) with uuid (${uuid}) connected`);
            socket.uuid = uuid;
            return next();
        }

        logger.info(`socket (${socket.id}) with uuid (${uuid}) is blacklisted.`);
        return next(new Error(ErrorMessage.BLACKLISTED_DEVICE));
    }
}
