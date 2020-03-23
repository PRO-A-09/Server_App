import {SocketConfig, logger} from './config.js'
import http from 'http'

/**
 * This class is used to manage the debate server.
 */
export class DebateManager {
    webServer;

    /**
     * Start the DebateManager
     */
    start() {
        this.startWebServer()
    }

    /**
     * Start and configure a new web server
     */
    startWebServer() {
        logger.info('Starting DebateManager web server');

        // Create a new http server
        this.webServer = http.createServer((req, res) => {
            res.write('Socket.io server');
            res.end();
        });

        // Listen on the specified port
        this.webServer.listen(SocketConfig.SOCKET_PORT, _ => {
            logger.info(`Server listening on *:${SocketConfig.SOCKET_PORT}`)
        });
    }

    /**
     * Stop the debate manager
     */
    stop() {
        logger.info("Server stopping");
        this.webServer.close();
    }
}
