import {logger} from './conf/config.js'

/**
 * Class implementing a Middleware function with a fixed password
 */
export class AdminMiddleware {
    /**
     * This function checks the password send by the socket and
     * chains to the next middleware
     * @param socket socket attempting a connection
     * @param next middleware function
     * @returns {*} the result returned by the next middleware
     */
    middlewareFunction(socket, next) {
        logger.debug('New connection to the admin namespace');

        const password = socket.handshake.query.password;
        socket.handshake.query.password = null;

        if (password === 'password') {
            logger.info('Successful connection to the admin namespace');
            return next();
        }

        logger.debug('Invalid password');
        return next(new Error('Invalid password'));
    }
}