import {SocketConfig, logger} from '../conf/config.js';
import {dbManager} from "./database/DatabaseManager.js";

/**
 * This class implements a new Debate and the communication with the clients.
 */
export class Statistic {
    adminRoomName;
    adminRoom;
    userNamespace;
    admin;

    /**
     * Create a Statistics for an admin
     * @param ownerSocket socket of the debate creator
     * @param io Socket.io server
     * @param adminNamespace admin namespace to create the room communicate with the admins
     */
    constructor(ownerSocket, io, adminNamespace) {
        this.adminRoomName = SocketConfig.ADMIN_ROOM_PREFIX + "STATISTIC";
        this.adminRoom = adminNamespace.to(this.adminRoomName);
        this.admin = ownerSocket.username;
        //For local tests
        //this.admin = "admin";

        // Join the admin room
        ownerSocket.join(this.adminRoomName);

        // Create a new namespace for the Statistic
        this.userNamespace = io.of("STATISTIC");
    }

    discussionFormat(discussion){
        return {
            id: discussion._id,
            title: discussion.title,
            description: discussion.description,
            time: discussion.finishTime - discussion.startTime
        }
    }

    responseFormat(response, numberTotalVotes){
        return {
            response: response.response,
            numberVotes: response.devices.length,
            percentage: (response.devices.length/numberTotalVotes) * 100
        }
    }

    /**
     * Starts handling for client events.
     */
    startSocketHandling() {
        this.userNamespace.on('connection', (socket) => {
            logger.debug(`New socket connected to namespace ${this.userNamespace.name} + ${socket.id}`);

            // Register socket functions
            socket.on('getAdminStats', this.getAdminStats(socket));
            socket.on('getDebatStats', this.getDebatStats(socket));
            socket.on('getQuestionStats', this.getQuestionStats(socket));

        });
    }

    // This section contains the different socket io functions

    /**
     * Return an array that contains stats for the debates of an admin in the result of the callback function
     */
    getAdminStats = (socket) => async (admin, callback) => {
        logger.debug(`getAdminStats received from ${socket.id}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let allDiscussions = await dbManager.getDiscussionsAdmin(admin);

        callback([allDiscussions.size(), Array.from(allDiscussions.values(), d => this.discussionFormat(d))]);
    };

    /**
     * Return an array that contains stats for a specific debate in the result of the callback function
     */
    getDebatStats = (socket) => async (debateID, callback) => {
        logger.debug(`getDebatStats received from ${socket.id}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let allQuestions = await dbManager.getQuestionsDiscussion(debateID);

        callback([allQuestions.size()]);
    };

    /**
     * Return an array that contains stats for a specific debate in the result of the callback function
     */
    getQuestionStats = (socket) => async (questionID, discussionID, callback) => {
        logger.debug(`getQuestionStats received from ${socket.id}`);

        if (!(callback instanceof Function)) {
            logger.debug(`callback is not a function.`);
            return;
        }

        let allResponses = await dbManager.getResponsesQuestion(questionID, discussionID);
        let numberTotalVotes = 0;
        // Get all the votes for all the responses
        for (let i = 0; i < allResponses.length; ++i) {
            numberTotalVotes += allResponses[i].devices.length;
        }

        callback([allResponses.size(), Array.from(allResponses.values(), r => this.responseFormat(r, numberTotalVotes))]);
    };
}
