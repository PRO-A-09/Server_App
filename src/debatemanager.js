import {SocketConfig, logger} from './conf/config.js'
import {PrivilegedNamespace} from './namespace/privilegednamespace.js';
import {LoginMiddleware} from './middleware/loginmiddleware.js';
import http from 'http'
import http_terminator from 'http-terminator';
import Server from 'socket.io'
import {dbManager} from "./database/DatabaseManager.js";
import {Debate} from "./debate/debate.js";

/**
 * This class is used to manage the debate server.
 */
export class DebateManager {
    webServer;
    io;
    nspAdmin;

    /**
     * Start the DebateManager
     */
    async start() {
        this.startWebServer();
        this.startSocketServer();
        this.startPrivilegedNamespace();

        await dbManager.start();
        await this.initializeDebates();
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

        this.webServer.on('error', (e) => {
            logger.error(`Web server error : ${e.code}. Stack trace : ${e.stack}`);
            if (e.code === 'EADDRINUSE') {
                logger.error('Forcefully exiting application...');
                process.exit(-1);
            }
        });

        // Listen on the specified port
        this.webServer.listen(SocketConfig.SOCKET_PORT, _ => {
            logger.info(`Server listening on *:${SocketConfig.SOCKET_PORT}`)
        });
    }

    /**
     * Starts a new socket.io server listening on the webServer.
     */
    startSocketServer() {
        // Create new socket.io server, listening on a specific path
        this.io = new Server(this.webServer, {
            path: SocketConfig.DEFAULT_PATH
        });

        // Setup handlers
        this.io.on('connection', (socket) => {
            logger.debug(`New socket (${socket.id}) connected to server`);

            socket.on('error', (error) => {
                logger.warn(`Socket error from (${socket.id}): ${error}`);
            });

            socket.on('disconnect', (reason) => {
                logger.debug(`Socket (${socket.id}) disconnected`);
            });

            socket.on(`newAdmin`, async (user, callback) => {
                logger.debug(`New admin to add to the database`);
                if(user.username == null){
                    callback(false, "Username cannot be null");
                }
                if(user.password == null){
                    callback(false, "Password cannot be null");
                }
                let result = await dbManager.saveUser(user.username, user.password);
                if(result === true){
                    callback(true, "Username was inserted");
                } else{
                    callback(false, result);
                }

            });
        });
    }

    /**
     * Creates a new Privilegednamespace and registers our middleware.
     */
    startPrivilegedNamespace() {
        this.nspAdmin = new PrivilegedNamespace(this.io);
        const adminMiddleware = new LoginMiddleware();

        this.nspAdmin.registerMiddleware(adminMiddleware.middlewareFunction);
        this.nspAdmin.startSocketHandling();
    }

    async initializeDebates() {
        // Search the last debate in the database
        Debate.nb_debate = await dbManager.getLastDiscussionId();
    }

    /**
     * Stop the debate manager
     */
    stop() {
        logger.info("Server stopping");

        dbManager.end();

        // Use http-terminator to gracefully terminate the server
        const httpTerminator = http_terminator.createHttpTerminator({
            server: this.webServer
        });
        httpTerminator.terminate();
    }
}
