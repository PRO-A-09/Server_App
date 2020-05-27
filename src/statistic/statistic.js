import {SocketConfig, logger} from '../conf/config.js';
import {dbManager} from "../database/DatabaseManager.js";

/**
 * This class implements all the functions related to the statistics shown by the application.
 */
export class Statistic {

    /**
     * Will format a discussion to have only useful data for statistic
     * @param aDiscussion an object Discussion contained in the database
     * @returns {{id: *, title: *, description: *, time: *}} array containing id: the id of the discussion, title: the title of the discussion,
     * description: the description of the discussion, time: the total time of the discussion in the format Xh Xm or "en cours" if no finishTime
     */
    discussionFormat(aDiscussion){
        let time;
        // If the finishTime is define we will calculate the duration of the deabte
        if(typeof aDiscussion.finishTime !== 'undefined'){
            let differenceHours = aDiscussion.finishTime.getHours() - aDiscussion.startTime.getHours();
            let differenceMiutes = aDiscussion.finishTime.getMinutes() - aDiscussion.startTime.getMinutes();
            time = differenceHours + "h " + differenceMiutes + "m";
        }
        else{
            time = "en cours";
        }
        return {
            id: aDiscussion._id,
            title: aDiscussion.title,
            description: aDiscussion.description,
            time: time
        }
    }

    /**
     * Will format the question to have only useful data for statistics
     * @param aQuestion an object Question that is a Question contained in the database
     * @returns {{title: *, numberVotes: *}} array containing title: the title of the question and numberVotes: the total
     * of all the votes for the responses for this question
     */
    questionFormat(aQuestion){
        logger.debug(`Formatting question : ${aQuestion}`);
        return {
            title: aQuestion.titreQuestion,
            numberVotes: aQuestion.numberVotes
        }
    }

    /**
     * Will format the response to have only useful data for statistics
     * @param aResponse an object Response that is a Response contained in the database
     * @param numberTotalVotes the number of votes for the response
     * @returns {{response: *, percentage: number, numberVotes: *}}
     */
    responseFormat(aResponse, numberTotalVotes){
        return {
            response: aResponse.response,
            numberVotes: aResponse.devices.length,
            percentage: Math.round((aResponse.devices.length/numberTotalVotes) * 100)
        }
    }

    /**
     * Return all the informations desired when we want to make stats for an admin
     * @param aUsername String that represents the username of the admin
     * @returns {Promise<*[]>} an Array containing all the stats of the admin or an empty one if it fails
     */
    async adminStats(aUsername){
        let allDiscussions = await dbManager.getDiscussionsAdmin(aUsername);

        if (allDiscussions == null) {
            logger.warn(`No discussions found for admin ${aUsername}`);
            return [];
        }

        return [allDiscussions.length, Array.from(allDiscussions.values(), d => this.discussionFormat(d))];
    };

    /**
     * Get the number of the total of votes for all the responses for a question.
     * @param aQuestionId integer that is the id of the question
     * @param aDiscussionId integer that is the id of the discussion
     * @returns {Promise<number>} an integer that is the number of votes
     */
    async getNumberVotesQuestion(aQuestionId, aDiscussionId) {
        let numberTotalVotes = 0;
        // Get all the responses related to the question desired
        let allResponses = await dbManager.getResponsesQuestion(aQuestionId, aDiscussionId);
        if (allResponses == null) {
            logger.warn(`No Responses found for question with id ${aQuestionId} and debate id ${aDiscussionId}`);
        } else {
            // Get all the votes for all the responses
            for (let i = 0; i < allResponses.length; ++i) {
                numberTotalVotes += allResponses[i].devices.length;
            }
        }
        return numberTotalVotes;
    }

    async getAuditors(aDiscussionId, activeDebates){
        let auditors = 0;
        let debate = activeDebates.get(aDiscussionId);
        if(debate == null){
            debate = await dbManager.getDiscussion(aDiscussionId);
            if (debate == null) {
                logger.warn(`No debate found with id ${aDiscussionId}`);
                return auditors;
            }
            auditors = debate.auditors;
        } else{
            logger.debug(`I got auditors from active debate ${debate.clients}`);
            auditors = debate.clients;
        }
        return auditors;
    }

    /**
     * Get all the stats for a debate
     * @param aDiscussionId the id of the discussion to get the stats from
     * @param activeDebates all the active debates on the server
     * @returns {Promise<*[]>} an array containing the stats wanted for a debate or an empty one if it fails
     */
    async debateStats(aDiscussionId, activeDebates){
        // Get the discussion in the database
        let debate = await dbManager.getDiscussion(aDiscussionId);
        if (debate == null) {
            logger.warn(`No debate found with id ${aDiscussionId}`);
            return [];
        }
        // Get all the questions related to the debate
        let allQuestions = await dbManager.getQuestionsDiscussion(aDiscussionId);
        if (allQuestions == null) {
            logger.warn(`No questions found for debate with id ${aDiscussionId}`);
            return [];
        }
        // Get the number of votes for all the Questions
        for(let i = 0; i < allQuestions.length; ++i) {
            allQuestions[i].numberVotes = await this.getNumberVotesQuestion(allQuestions[i].id, aDiscussionId);
        }
        let auditors = await this.getAuditors(aDiscussionId, activeDebates);
        return [allQuestions.length, auditors, Array.from(allQuestions.values(), q => this.questionFormat(q)).
        // Will sort the questions by the number of votes most actives in first places
        sort(function (a, b) {
            if (a.numberVotes > b.numberVotes) {
                return -1;
            }
            if (b.numberVotes > a.numberVotes) {
                return 1;
            }
            return 0;
        })];
    };

    /**
     * Get all the stats a the question
     * @param aQuestionId integer that is the id of the question
     * @param aDiscussionId integer that is the id of the discussion
     * @param activeDebates all the active debates on the server
     * @returns {Promise<*[]>} Array that contains the stats wanted for a question or an empty one if it fails
     */
   async questionStats(aQuestionId, aDiscussionId, activeDebates){
        let auditors = await this.getAuditors(aDiscussionId, activeDebates);
        let allResponses = await dbManager.getResponsesQuestion(aQuestionId, aDiscussionId);
        if (allResponses == null) {
            logger.warn(`No responses found for question ${aQuestionId} with debate id ${aDiscussionId}`);
            return [];
        }
       let numberTotalVotes = await this.getNumberVotesQuestion(aQuestionId,aDiscussionId);
       let interest = auditors === 0 ? 0 : Math.round((numberTotalVotes/auditors) * 100);
       return [allResponses.length, interest, Array.from(allResponses.values(), r => this.responseFormat(r, numberTotalVotes))];
   }
}
