import {SocketConfig, logger} from '../conf/config.js';
import {dbManager} from "../database/DatabaseManager.js";

/**
 * This class implements all the functions related to the statistics shown by the application.
 */
export class Statistic {

    /**
     * Will format a discussion to have only useful data for statistic
     * @param discussion an object Discussion contained in the database
     * @returns {{id: *, title: *, description: *, time: *}} array containing id: the id of the discussion, title: the title of the discussion,
     * description: the description of the discussion, time: the total time of the discussion in the format Xh Xm or "en cours" if no finishTime
     */
    discussionFormat(discussion){
        let time;
        // If the finishtTime is define we will calculate the duration of the deabte
        if(typeof discussion.finishTime !== 'undefined'){
            let differenceHours = discussion.finishTime.getHours() - discussion.startTime.getHours();
            let differenceMiutes = discussion.finishTime.getMinutes() - discussion.startTime.getMinutes();
            time = differenceHours + "h " + differenceMiutes + "m";
        }
        else{
            time = "en cours";
        }
        return {
            id: discussion._id,
            title: discussion.title,
            description: discussion.description,
            time: time
        }
    }

    /**
     * Will format the question to have only useful data for statistics
     * @param question an object Question that is a Question contained in the database
     * @returns {{title: *, numberVotes: *}} array containing title: the title of the question and numberVotes: the total
     * of all the votes for the responses for this question
     */
    questionFormat(question){
        logger.debug(`Formatting question : ${question}`);
        return {
            title: question.titreQuestion,
            numberVotes: question.numberVotes
        }
    }

    /**
     * Will format the response to have only useful data for statistics
     * @param response an object Response that is a Response contained in the database
     * @param numberTotalVotes the number of votes for the response
     * @returns {{response: *, percentage: number, numberVotes: *}}
     */
    responseFormat(response, numberTotalVotes){
        return {
            response: response.response,
            numberVotes: response.devices.length,
            percentage: (response.devices.length/numberTotalVotes) * 100
        }
    }

    /**
     * Return an array that contains stats for the debates of an admin in the result of the callback function
     */
    async adminStats(admin){
        let allDiscussions = await dbManager.getDiscussionsAdmin(admin);

        return [allDiscussions.length, Array.from(allDiscussions.values(), d => this.discussionFormat(d))];
    };

    async getNumberVotesQuestion(questionId, discussionId) {
        let allResponses = await dbManager.getResponsesQuestion(questionId, discussionId);
        let numberTotalVotes = 0;
        // Get all the votes for all the responses
        for (let i = 0; i < allResponses.length; ++i) {
            numberTotalVotes += allResponses[i].devices.length;
        }
        logger.info(`The number of votes : ${numberTotalVotes}`);
        return numberTotalVotes;
    }

    /**
     * Return an array that contains stats for a specific debate in the result of the callback function
     */
    async debateStats(debateID){

        let debate = await dbManager.getDiscussion(debateID);
        let allQuestions = await dbManager.getQuestionsDiscussion(debateID);
        for(let i = 0; i < allQuestions.length; ++i) {
            allQuestions[i].numberVotes = await this.getNumberVotesQuestion(allQuestions[i].id, debateID);
            logger.debug(allQuestions[i].numberVotes);// To remove
        }

        return [allQuestions.length, debate.auditeurs, Array.from(allQuestions.values(), q => this.questionFormat(q)).
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

   async questionStats(questionId, discussionId){
       let allResponses = await dbManager.getResponsesQuestion(questionId, discussionId);
       let numberTotalVotes = 0;
       // Get all the votes for all the responses
       for (let i = 0; i < allResponses.length; ++i) {
           numberTotalVotes += allResponses[i].devices.length;
       }

       callback([allResponses.size(), Array.from(allResponses.values(), r => this.responseFormat(r, numberTotalVotes))]);
   }
}
