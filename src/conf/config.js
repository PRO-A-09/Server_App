import winston from "winston";

export class SocketConfig {
    static SOCKET_PORT = 8080;
    static DEFAULT_PATH = '/socket-io';
    static ADMIN_NAMESPACE = '/admin';
    static ADMIN_PASSWORD = 'pass';
    static ADMIN_ROOM_PREFIX = 'ADMIN-';
    static DEBATE_NAMESPACE_PREFIX = 'DEBATE-';
}

export class ErrorMessage {
    static ADMIN_PASSWORD_INVALID = 'Invalid password';
}

// Create a winston logger that logs to console
export const logger = winston.createLogger({
    transports: [
        new winston.transports.Console( {
            level: 'debug',
            format:  winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ],
});