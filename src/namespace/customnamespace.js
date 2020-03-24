/**
 * Class wrapping a custom socket.io Namespace
 */
export class CustomNamespace {
    // Socket.io Namespace
    nsp;

    /**
     * Default constructor that saves the socket.io Namespace
     * @param nsp socket.io Namespace
     */
    constructor(nsp) {
        this.nsp = nsp;
    }

    /**
     * This function configures a new middleware for the namespace.
     * @param middleware function that takes a socket and a function in argument
     */
    registerMiddleware(middleware) {
        this.nsp.use(middleware);
    }

    /**
     * This function setup the namespace by listening on events and handling them.
     * It must be implemented by child classes.
     */
    startSocketHandling() {
        throw new Error('startSocketHandling() is not implemented.');
    }
}
