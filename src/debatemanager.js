import {SocketConfig, logger} from './config.js'
import http from 'http'
import http_terminator from 'http-terminator';
import Server from 'socket.io'

/**
 * This class is used to manage the debate server.
 */
export class DebateManager {
    webServer;
    io;

    /**
     * Start the DebateManager
     */
    start() {
        this.startWebServer();
        this.startSocketServer();
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

    startSocketServer() {
        // Create new socket.io server, listening on a specific path
        this.io = new Server(this.webServer, {
            path: SocketConfig.DEFAULT_PATH
        });

        // Setup handlers
        this.io.on('connect', (socket) => {
            logger.debug(`New socket (${socket.id}) connected to server`);

            socket.on('disconnect', (reason) => {
                logger.debug(`Socket (${socket.id}) disconnected`);
            });
        });
    }

    /**
     * Stop the debate manager
     */
    stop() {
        logger.info("Server stopping");
        
        // Use http-terminator to gracefully terminate the server
        const httpTerminator = http_terminator.createHttpTerminator({
            server: this.webServer
        });
        httpTerminator.terminate();
    }
}
