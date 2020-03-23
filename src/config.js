import winston from "winston";

export class SocketConfig {
    static SOCKET_PORT = 8080;
    static DEFAULT_PATH = '/socket-io';
}

// Create a winston logger that logs to console
export const logger = winston.createLogger({
    transports: [
        new winston.transports.Console( {
            level: 'warning',
            format:  winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
});