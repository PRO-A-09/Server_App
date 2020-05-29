import winston from "winston";

export class SocketConfig {
    static TEST_SERVER_NAME = "localhost";
    static SOCKET_PORT = 8080;
    static DEFAULT_PATH = '/socket-io';
    static PRIVILEGED_NAMESPACE = '/admin';
    static ADMIN_PASSWORD = 'pass';
    static ADMIN_ROOM_PREFIX = 'ADMIN-';
    static DEBATE_NAMESPACE_PREFIX = '/DEBATE-';
}

export class ErrorMessage {
    static LOGIN_PASSWORD_INVALID = 'Invalid password';
    static UNSPECIFIED_UUID = 'Device UUID need to be provided';
    static BLACKLISTED_DEVICE = 'This device has been banned';
    static BAN_MESSAGE = 'You have been banned';
}

export class DebateConfig {
    static MAX_TITLE_LENGTH = 50;
    static MAX_DESCRIPTION_LENGTH = 250;
    static MAX_CLOSED_ANSWERS = 20;
    static MAX_OPEN_ANSWER_LENGTH = 150;
    static MAX_QUESTION_LENGTH = 50;
    static MAX_SUGGESTION_LENGTH = 150;
    static MAX_SUGGESTIONS = 10;
}

export class PasswordConfig {
    static NB_ROUNDS = 12;
    static MIN_LENGTH = 8;
}

export class SSLConfig {
    static CERT       = '/etc/letsencrypt/live/sondage.codeheure.com/cert.pem';
    static CERT_CHAIN = '/etc/letsencrypt/live/sondage.codeheure.com/chain.pem';
    static CERT_KEY   = '/etc/letsencrypt/live/sondage.codeheure.com/privkey.pem';
}

export function isProduction() {
    return process.env.NODE_ENV === 'production';
}

export function getProtocol() {
    return process.env.NODE_ENV === 'production' ? 'https' : 'http';
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