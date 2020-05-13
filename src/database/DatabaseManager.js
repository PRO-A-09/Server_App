import mongoose from 'mongoose';
import {Discussion} from './modele/Discussion.js';
import {Question} from './modele/Question.js';
import {Response} from './modele/Response.js';
import {Administrator} from './modele/Users.js';
import {logger} from '../conf/config.js';

/**
 * This class is used to manage the database communication.
 */
export class DataBaseManager {

    /**
     * Start the DataBaseManager by connecting to the mongoDB instance
     */
    start() {
        // Connection to the local database
        mongoose.connect('mongodb://localhost:27017/PRO', {useNewUrlParser: true, useUnifiedTopology: true});
        mongoose.set('useCreateIndex', true);
    }

    /**
     * Close the connection to the database
     */
    async end(){
        // Close the connection
        await mongoose.connection.close();
    }

    /**
     * Get the password of an administrator
     * @param username String that is the username of the administrator
     * @returns a String that is the result of the request for the password or null if password not found
     */
    async getAdminPassword(username){
        let password = null;
        logger.debug(`Getting the password of the user ${username}`);
        let user = await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) logger.debug(`Impossible to find username`);
            else{
                logger.debug(`User found: ${username}`);
            }
        });
        if(user != null){
            password = user.password;
        }
        return password;
    }

    /**
     * Get the id of an administrator
     * @param username String that is the username of the administrator
     * @returns a String that represents the id of the user or null if username not found
     */
    async getAdminId(username){
        let id = null;
        logger.debug(`Getting the id of the user ${username}`);
        await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) logger.debug(`Impossible to find username`);
            else id = username._id;
        });
        return id;
    }

    async getDiscussion(anIdDiscussion){
        logger.debug(`Getting the Discussions with id ${anIdDiscussion}`);
        // Get all the discussions related to the user
        return Discussion.findOne({_id: anIdDiscussion}, function (err, discussion) {
            if (err || discussion == null) logger.debug(`Error when requesting discussion`);
            else {
                console.log(discussion);
            }
        });
    }

    /**
     * Get the discussions of an administrator
     * @param username String that is the username of the administrator
     * @returns a Array of Discussion that represents the discussions started by an user
     */
    async getDiscussionsAdmin(username){
        let discussions = null;
        // Get the id of the username passed in parameter
        let adminId = await this.getAdminId(username);
        // If the adminId is null the username is unknown
        if(adminId == null){
            logger.debug(`Error when looking for username id`);
        }
        else {
            logger.debug(`Getting the Discussions from ${username}`);
            // Get all the discussions related to the user
            discussions = await Discussion.find({administrator: adminId}, function (err, discussions) {
                if (err || discussions == null) logger.debug(`Error when requesting discussions`);
                else{
                    console.log(discussions);
                }
            });
        }
        return discussions;
    }

    /**
     * Get the questions from discussion
     * @param anIDDebate Integer that is the id of the debate that we want to get the questions from
     * @returns a Array of Questions that represents the questions related to the discussion
     */
    async getQuestionsDiscussion(anIDDebate){
        let questions = null;
        // If id is null error
        if(anIDDebate == null){
            logger.debug(`Error Debate ID cannot be null`);
        }
        else {
            logger.debug(`Getting the Questions from discussions ${anIDDebate}`);
            // Get all the questions from the DB from the desired debate
            questions = await Question.find({refDiscussion: anIDDebate}, function (err, questions) {
                if (err || questions == null) logger.debug(`Error when requesting questions`);
                else{
                    console.log(questions);
                }
            });
        }
        return questions;
    }

    /**
     * Get the responses from a device
     * @param aUUID String that is the UUID of the device that we want to get the responses from
     * @returns an Array of Responses that represents the responses related to the Device
     */
    async getResponsesDevice(aUUID){
        let responses = null;
        // If id is null error
        if(aUUID == null){
            logger.debug(`Error UUID cannot be null`);
        }
        else {
            logger.debug(`Getting the Responses from Device ${aUUID}`);
            // Get all the responses from the DB from the desired device
            responses = await Response.find({"devices.refDevice": aUUID}, function (err, responses) {
                if (err || responses == null) logger.debug(`Error when requesting responses`);
                else{
                    logger.debug(responses);
                }
            });
        }
        return responses;
    }

    /**
     * Get all responses from a question
     * @param anIDQuestion Integer that is the ID of the question thta we want to get the responses from
     * @param anIDDebate Integer that is the ID of the disucssion related to the question
     * @returns an Array of Responses that represents the responses related to the Question
     */
    async getResponsesQuestion(anIDQuestion, anIDDebate){
        let responses = null;
        // If id is null error
        if(anIDQuestion == null){
            logger.debug(`Error Question ID cannot be null`);
        }
        else {
            logger.debug(`Getting the Responses from Question ${anIDQuestion} of the debate ${anIDDebate}`);
            // Get all the responses from the DB from the desired device
            responses = await Response.find({"refQuestion.refQuestion": anIDQuestion, "refQuestion.refDiscussion": anIDDebate}, function (err, responses) {
                if (err || responses == null) logger.debug(`Error when requesting responses`);
                else{
                    logger.debug(responses);
                }
            });
        }
        return responses;
    }

    /**
     * Save a discussion in the database
     * @param discussion object Debate that represents the discussion to save in the databse
     * @returns {Promise<boolean>} true if the saving was successful false otherwise
     */
    async saveDiscussion(discussion){
        // Show the Disucssion that will be saved
        console.log(discussion);
        let saved = true;
        // Search for the admin id of the discussion
        let idAdmin = await this.getAdminId(discussion.admin);
        if(idAdmin == null){
            logger.debug(`Error when looking for username id`);
            return false;
        }
        /* Search for participants is not enable for the moment because participant are not implemented in the server
        var arr = [];
        for(var key of discussion.participant.keys()){
            arr.push({refParticipant: key });
        }
        */
        // Creation of object Discussion with desired values
        const discussion1 = new Discussion({
            _id: discussion.debateID,
            title: discussion.title,
            description: discussion.description,
            startTime: new Date(),
            administrator: idAdmin
        });
        // Try to save the discussion in database
        await discussion1.save()
              .then(discussionSaved => logger.debug(`Discussion saved ${discussionSaved}`))
              .catch(err => {
                            logger.debug(`Error when saving Disucssion`);
                            console.log(err);
                            saved = false
              });
        logger.debug(`saved = ${saved}`);
        // If the save function failed exit the function with false
        if(!saved){
            return saved;
        }
        // Save all the questions related to the discussion
        for(let key of discussion.questions.keys()){
            let savedState = await this.saveQuestion(discussion.questions.get(key), discussion.debateID);
            // If one of the questions fail to save exit the function with false
            if(!savedState){
                return false;
            }
        }
        return saved;
        // Add finishTime to the discussion not implemented yet
        /* discussion1.finishTime = new Date();
        await discussion1.save(); */
    }

    /**
     * Save a question in the database
     * @param question object Question that represents the Question to save
     * @param idDiscussion integer that is the id of the Discussion related to the question
     * @returns {Promise<boolean>} true if the save went well false otherwise
     */
    async saveQuestion(question, idDiscussion){
        let saved = true;
        const questionSave = new Question({
            id: question.id,
            titreQuestion: question.title,
            numberVotes: 0,
            refDiscussion: idDiscussion
        });
        // Save the question in database
        await questionSave.save()
            .then(questionSaved => logger.debug(`Question saved ${questionSaved}`))
            .catch(err => {
                logger.debug(`Error when saving Question id = ${question.id}`);
                console.log(err);
                saved = false;
            });
        // If the save went wrong we exit the function and return false;
        if(!saved){
            return false;
        }
        // Save all the responses related to the question
        for (let i = 0; i < question.answers.length; ++i) {
            let savedState = await this.saveResponse(i, question.answers[i].answer, question.id, idDiscussion);
            if(!savedState){
                return false;
            }
        }
        return saved;
    }

    /**
     * Save the response in the database
     * @param responseId the id of response that need to be saved
     * @param response the response that need to be saved
     * @param questionId integer that is the id of the question related to the response
     * @param discussionId integer that is the id of the discussion related to the response
     * @returns {Promise<boolean>} true if save went well false otherwise
     */
    async saveResponse(responseId, response, questionId, discussionId){
        let saved = true;
        const responseSave = new Response({
            id: responseId,
            response: response,
            refQuestion: {
                refQuestion: questionId,
                refDiscussion: discussionId
            }
        });
        // Save the response in database
        await responseSave.save()
            .then(responseSaved => logger.debug(`Response saved ${responseSaved}`))
            .catch(err => {
                logger.debug(`Error when saving Response id = ${responseId}`);
                console.log(err);
                saved = false;
            });
        return saved;
    }

    /**
     * Get the id of the latest discussion
     */
    async getLastDiscussionId() {
        logger.debug('getLastDiscussionId called');
        return new Promise(resolve => {
            Discussion.find().sort({_id: 'descending'}).exec((err, discussions) => {
                if (err) {
                    logger.debug('getLastDiscussionId returning 0');
                    resolve(0);
                } else {
                    logger.debug(`getLastDiscussionId returning ${discussions[0]._id}`);
                    resolve(discussions[0]._id);
                }
            });
        });
    }
}

export const dbManager = new DataBaseManager();
