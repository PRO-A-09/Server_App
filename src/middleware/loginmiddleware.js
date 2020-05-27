import {SocketConfig, logger, ErrorMessage} from '../conf/config.js'
import {DataBaseManager} from "../database/DatabaseManager.js";
import {dbManager} from "../database/DatabaseManager.js";
import bcrypt from 'bcrypt';

/**
 * Class implementing a Middleware function with a fixed password
 */
export class LoginMiddleware {
    /**
     * This function checks the password send by the socket and
     * chains to the next middleware
     * @param socket socket attempting a connection
     * @param next middleware function
     * @returns {*} the result returned by the next middleware
     */
    async middlewareFunction(socket, next) {
        logger.debug('New connection to the admin namespace');

        const password = socket.handshake.query.password;
        const username = socket.handshake.query.username;
        socket.username = username;
        socket.handshake.query.password = null;

        let adminHash = await dbManager.getAdminPassword(username);
        let res = await new Promise(resolve => {
            bcrypt.compare(password, adminHash, (err, res) => {
                if (err) {
                    logger.error(`Error while comparing bcrypt passwords: ${err}`);
                    resolve(false);
                } else {
                    return res;
                }
            });
        });

        if (res === true) {
            logger.info('Successful connection to the admin namespace');
            socket.userid = await dbManager.getAdminId(username);
            return next();
        }

        logger.debug(ErrorMessage.LOGIN_PASSWORD_INVALID);
        return next(new Error(ErrorMessage.LOGIN_PASSWORD_INVALID));
    }
}