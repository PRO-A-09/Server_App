/**
 * Class wrapping a custom socket.io Namespace
 */
export class CustomNamespace {
    nsp;

    constructor(nsp) {
        this.nsp = nsp;
    }

    setMiddleware(middleware) {
        this.nsp.use(middleware);
    }

    startSocketHandling() {
        throw new Error('startSocketHandling() is not implemented.');
    }
}
