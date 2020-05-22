/*
* File: DatabaseManager.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 30 mars 2020
* Description: Implement all the functions that have an interaction with the database
*/
import mongoose from 'mongoose';
import {Device} from './modele/Device.js';
import {Discussion} from './modele/Discussion.js';
import {Participant} from './modele/Participant.js';
import {Question} from './modele/Question.js';
import {Response} from './modele/Response.js';
import {Tag} from './modele/Tag.js';
import {Administrator,Moderator,Presentator,UserModerator} from './modele/Users.js';
import {logger} from '../conf/config.js';
import {QuestionAdmin} from "./modele/QuestionAdmin.js";
import {QuestionSuggestion} from "./modele/QuestionSuggestion.js";

/**
 * This class is used to manage the database communication.
 */
export class DataBaseManager {

    /**
     * Start the DataBaseManager by connecting to the mongoDB instance
     */
    async start() {
        // Connection to the local database
        try {
            await mongoose.connect('mongodb://localhost:27017/PRO', {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            logger.info('Mongodb connection started');
        } catch (err) {
            logger.error(`Mongodb connection error : ${err.code}. Stack trace : ${err.stack}`);
            throw(err);
        }

        mongoose.set('useCreateIndex', true);
    }

    /**
     * Close the connection to the database
     */
    async end(){
        await mongoose.connection.close();
    }

    /**
     * Get the password of an administrator
     * @param aUsername String that is the username of the administrator
     * @returns a String that is the result of the request for the password or null if password not found
     */
    async getAdminPassword(aUsername){
        let password = null;
        logger.debug(`Getting the password of the user ${aUsername}`);
        let user = await Administrator.findOne({login: aUsername}, function (err,username) {
            if (err || username == null) {
                logger.debug(`Impossible to find username`);
            } else {
                logger.debug(`User found: ${username}`);
            }
        });
        if (user != null) {
            password = user.password;
        }
        return password;
    }

    /**
     * Get the id of an administrator
     * @param aUsername String that is the username of the administrator
     * @returns a String that represents the id of the user or null if username not found
     */
    async getAdminId(aUsername){
        let id = null;
        logger.debug(`Getting the id of the user ${aUsername}`);
        let user = await Administrator.findOne({login: aUsername}, function (err,username) {
            if (err || username == null) {
                logger.debug(`Impossible to find username`);
            } else {
                logger.debug(`User found: ${username}`);
            }
        });
        logger.info(user);
        if (user != null) {
            id = user._id;
        }
        return id;
    }

    /**
     * Get a discussion stored in the database with the corresponding id
     * @param anIdDiscussion integer that represents the id of the discussion desired
     * @returns {Promise<Query|void>} A Discussion or null if not found
     */
    async getDiscussion(anIdDiscussion){
        logger.debug(`Getting the Discussion with id ${anIdDiscussion}`);
        // Get the discussion related to the id in parameter
        return Discussion.findOne({_id: anIdDiscussion}, function (err, discussion) {
            if (err || discussion == null) {
                logger.debug(`Error when requesting discussion`);
            }
            else {
                logger.debug(discussion);
            }
        });
    }

    /**
     * Get a question proposed by a user in the database with the corresponding id
     * @param anIdQuestion integer that represents the id of the question desired
     * @param anIdDiscussion integer that represents the id of the discussion related to the question
     * @returns {Promise<Query|void>} A Question or null if not found
     */
    async getUserQuestion(anIdQuestion, anIdDiscussion){
        logger.debug(`Getting the Question with id ${anIdQuestion}`);
        // Get the discussions related to the id
        return QuestionSuggestion.findOne({"id.refQuestion": anIdQuestion, "id.refDiscussion": anIdDiscussion}, function (err, question) {
            if (err || question == null) {
                logger.debug(`Error when requesting discussion`);
            } else {
                logger.debug(question);
            }
        });
    }

    /**
     * Get all the questions proposed by users and accepted by admin during a discussion
     * @param anIdDiscussion integer that represents the id of the discussion related to questions that we want
     * @returns {Promise<*>} an array of Questions or undefined if no questions with the id of the discussion passed are found
     */
    async getAcceptedQuestionsSuggestion(anIdDiscussion){
        logger.debug(`Getting the Question accepted by the admin of the debate ${anIdDiscussion}`);
        // Get the discussions related to the id
        return QuestionSuggestion.find({"id.refDiscussion": anIdDiscussion, approved: true}, function (err, questions) {
            if (err || questions == null) {
                logger.debug(`Error when requesting accepted question : No questions were found`);
            } else {
                logger.debug(questions);
            }
        });
    }

    /**
     * Get all the questions proposed by users but that are not yet accepted
     * @param anIdDiscussion integer that represents the id of the discussion related to questions that we want
     * @returns {Promise<*>} an array of Questions or undefined if no questions with the id of the discussion passed are found
     */
    async getNotYetAcceptedQuestionsSuggestion(anIdDiscussion){
        logger.debug(`Getting the Question not yet accepted by the admin of the debate ${anIdDiscussion}`);
        // Get the discussions related to the id and the approved status
        return QuestionSuggestion.find({"id.refDiscussion": anIdDiscussion, approved: undefined}, function (err, questions) {
            if (err || questions == null) {
                logger.debug(`Error when requesting not yet accepted question : No questions were found`);
            } else {
                logger.debug(questions);
            }
        });
    }

    /**
     * Get all the discussions started by an administrator
     * @param aUsername String that is the username of the administrator
     * @returns an Array of Discussion that represents the discussions started by a user
     */
    async getDiscussionsAdmin(aUsername){
        let discussions = null;
        // Get the id of the username passed in parameter
        let adminId = await this.getAdminId(aUsername);
        // If the adminId is null the username is unknown
        if (adminId == null) {
            logger.debug(`Error when looking for username id`);
        } else {
            logger.debug(`Getting the Discussions from ${aUsername}`);
            // Get all the discussions related to the user
            discussions = await Discussion.find({administrator: adminId}, function (err, discussions) {
                if (err || discussions == null) {
                    logger.debug(`Error when requesting discussions`);
                } else {
                    console.log(discussions);
                }
            });
        }
        return discussions;
    }

    /**
     * Get the closed discussions of an administrator
     * @param aUsername String that is the username of the administrator
     * @returns an Array of Discussion that represents the discussions started by a user
     */
    async getClosedDiscussionsAdmin(aUsername){
        let discussions = null;
        // Get the id of the username passed in parameter
        let adminId = await this.getAdminId(aUsername);
        // If the adminId is null the username is unknown
        if (adminId == null) {
            logger.debug(`Error when looking for username id`);
        } else {
            logger.debug(`Getting the Discussions from ${aUsername}`);
            // Get all the discussions related to the user and check if the finishTime filed exists because if that is
            // the case a discussion is closed
            discussions = await Discussion.find({administrator: adminId, finishTime: {$exists: true}}, function (err, discussions) {
                if (err) {
                    logger.debug(`Error when requesting discussions`);
                } else if (discussions == null) {
                    logger.debug(`No debates were found`);
                } else {
                    logger.debug(discussions);
                }
            });
        }
        return discussions;
    }

    /**
     * Get all the questions from discussion
     * @param anIdDebate Integer that is the id of the debate that we want to get the questions from
     * @returns an Array of Questions that represents the questions related to the discussion
     */
    async getQuestionsDiscussion(anIdDebate){
        let questions = null;
        // If id is null error
        if (anIdDebate == null) {
            logger.debug(`Error Debate ID cannot be null`);
        } else {
            logger.debug(`Getting the Questions from discussions ${anIdDebate}`);
            // Get all the questions from the DB from the desired debate
            questions = await Question.find({refDiscussion: anIdDebate}, function (err, questions) {
                if (err || questions == null) {
                    logger.debug(`Error when requesting questions`);
                } else {
                    logger.debug(questions);
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
        if (aUUID == null) {
            logger.debug(`Error UUID cannot be null`);
        } else {
            logger.debug(`Getting the Responses from Device ${aUUID}`);
            // Get all the responses from the DB from the desired device
            responses = await Response.find({"devices.refDevice": aUUID}, function (err, responses) {
                if (err || responses == null) {
                    logger.debug(`Error when requesting responses`);
                } else {
                    logger.debug(responses);
                }
            });
        }
        return responses;
    }

    /**
     * Get all responses from a question
     * @param aIdQuestion String that is the UUID of the device that we want to get the responses from
     * @returns an Array of Responses that represents the responses related to the Device
     */
    async getResponsesQuestion(aIdQuestion){
        let responses = null;
        // If id is null error
        if (aIdQuestion == null) {
            logger.debug(`Error Question ID cannot be null`);
        } else {
            logger.debug(`Getting the Responses from Question ${aIdQuestion}`);
            // Get all the responses from the DB from the desired device
            responses = await Response.find({refQuestion: aIdQuestion}, function (err, responses) {
                if (err || responses == null) {
                    logger.debug(`Error when requesting responses`);
                } else {
                    logger.debug(responses);
                }
            });
        }
        return responses;
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

    /**
     * Save a discussion in the database
     * @param aDiscussion object Debate that represents the discussion to save in the database
     * @returns {Promise<boolean>} true if the saving was successful false otherwise
     */
    async saveDiscussion(aDiscussion){
        // Show the Disucssion that will be saved
        logger.debug(`Discussion : ${aDiscussion}`);
        let saved = true;
        // Search for the admin id of the discussion
        let idAdmin = await this.getAdminId(aDiscussion.admin);
        if (idAdmin == null) {
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
        const discussion = new Discussion({
            _id: aDiscussion.debateID,
            title: aDiscussion.title,
            description: aDiscussion.description,
            startTime: new Date(),
            auditors: 0,
            administrator: idAdmin
        });
        // Try to save the discussion in database
        await discussion.save()
              .then(discussionSaved => logger.debug(`Discussion saved ${discussionSaved}`))
              .catch(err => {
                            logger.debug(`Error when saving Disucssion`);
                            logger.debug(err);
                            saved = false
              });
        logger.debug(`saved = ${saved}`);
        // If the save function failed exit the function with false
        if (!saved) {
            return saved;
        }
        // Save all the questions related to the discussion
        for(let key of aDiscussion.questions.keys()){
            let savedState = await this.saveQuestion(aDiscussion.questions.get(key), aDiscussion.debateID);
            // If one of the questions fail to save exit the function with false
            if (!savedState) {
                return false;
            }
        }
        return saved;
    }

    /**
     * Update a discussion when the discussion is closed.
     * Save the finish time and the number of auditors.
     * @param aIdDiscussion integer that is the Id of the discussion to update
     * @returns {Promise<boolean>} true if the update in the database went well false otherwise
     */
    async saveEndDiscussion(aIdDiscussion){
        if(aIdDiscussion != null) {
            // Get the current state of the discussion in the database
            let debate = await this.getDiscussion(aIdDiscussion);
            // If debate is null the discussion does not exist in the database so we exit with error
            if (debate == null) {
                logger.alert(`Error when updating discussion. Discussion not found`);
                return false;
            }
            logger.debug(`Updating discussion : ${debate}`);
            // Update the field finishTime and auditors
            debate.finishTime = new Date();
            // Will be changed by an attribute in the debate class
            debate.auditors = 57;
            let update = true;
            // Update the discussion in the database
            await debate.save()
                .then(debateUpdated => {
                    logger.debug(`Discussion updated saved ${debateUpdated}`);
                }).catch(err => {
                    logger.debug(`Error when updating discussion id = ${debate.id}`);
                    console.log(err);
                    update = false
                });
            return update;
        }
        return false;
    }

    /**
     * Save a question in the database
     * @param aQuestion object Question that represents the Question to save
     * @param aIdDiscussion integer that is the id of the Discussion related to the question
     * @returns {Promise<boolean>} true if the save went well false otherwise
     */
    async saveQuestion(aQuestion, aIdDiscussion){
        let saved = true;
        const questionSave = new Question({
            id: aQuestion.id,
            titreQuestion: aQuestion.title,
            refDiscussion: aIdDiscussion
        });
        // Save the question in database
        await questionSave.save()
            .then(questionSaved => logger.debug(`Question saved ${questionSaved}`))
            .catch(err => {
                logger.debug(`Error when saving Question id = ${aQuestion.id}`);
                logger.debug(err);
                saved = false;
            });
        // If the save went wrong we exit the function and return false
        if (!saved) {
            return false;
        }
        // Save all the responses related to the question
        for (let i = 0; i < aQuestion.answers.length; ++i) {
            let savedState = await this.saveResponse(i, aQuestion.answers[i].answer, aQuestion.id, aIdDiscussion);
            if (!savedState) {
                return false;
            }
        }
        return saved;
    }

    /**
     * Save a question of an admin in the database
     * @param aQuestion object Question that represents the Question to save
     * @param aIdDiscussion integer that is the id of the Discussion related to the question
     * @param aUsername String that is the username of the admin
     * @returns {Promise<boolean>} true if the save went well false otherwise
     */
    async saveQuestionAdmin(aQuestion, aIdDiscussion, aUsername){
        let saved = await this.saveQuestion(aQuestion,aIdDiscussion);
        if(!saved){
            return false;
        }
        // Save the question as an admin Question in the database
        let idAdmin = await this.getAdminId(aUsername);
        if(idAdmin == null){
            logger.debug(`Error when looking for username id`);
            return false;
        }

        const questionAdminSave = new QuestionAdmin({
            id: {
                refQuestion: aQuestion.id,
                refDiscussion: aIdDiscussion
            },
            administrator: idAdmin
        });

        await questionAdminSave.save()
            .then(questionAdminSave => logger.debug(`Question of admin saved ${questionAdminSave}`))
            .catch(err => {
                logger.debug(`Error when saving Question of admin id = ${aQuestion.id}`);
                console.log(err);
                saved = false;
            });
        return saved;
    }

    /**
     * Save a question suggested by a user in the database
     * @param aQuestion object Question that represents the Question to save
     * @param aIdDiscussion integer that is the id of the Discussion related to the question
     * @returns {Promise<boolean>} true if the save went well false otherwise
     */
    async saveQuestionUser(aQuestion, aIdDiscussion){
        // Save the question as a Question
        let saved = await this.saveQuestion(aQuestion,aIdDiscussion);
        // If the save of the question doesn't went well error
        if(!saved){
            return false;
        }
        const questionSuggestionSave = new QuestionSuggestion({
            id: {
                refQuestion: aQuestion.id,
                refDiscussion: aIdDiscussion
            }
        });

        // Save the question as a QuestionSuggestion
        await questionSuggestionSave.save()
            .then(questionAdminSave => logger.debug(`Question of user saved ${questionAdminSave}`))
            .catch(err => {
                logger.debug(`Error when saving Question of user id = ${aQuestion.id}`);
                console.log(err);
                saved = false;
            });
        // If the save went wrong we exit the function and return false
        return saved;
    }

    /**
     * Update a question as approved in the database
     * @param aQuestionId integer that is the id of the question that has been approved
     * @param aDiscussionId integer that is the id of teh discussion related to the question
     * @returns {Promise<boolean>} true if the update went well false otherwise
     */
    async approveQuestion(aQuestionId, aDiscussionId){
        let questionUser = await this.getUserQuestion(aQuestionId, aDiscussionId);

        if(questionUser == null){
            logger.debug(`Error when updating question. Question not found`);
            return false;
        }
        logger.debug(`Updating question : ${questionUser}`);
        // Update the field approved to true
        questionUser.approved = true;
        let update = true;
        // Update the question in the database
        await questionUser.save()
            .then(questionUpdated => {
                logger.debug(`Question suggestion updated saved ${questionUpdated}`);
            }).catch(err => {
                logger.debug(`Error when updating question suggestion id = ${aQuestionId}`);
                console.log(err);
                update = false
            });
        return update;
    }

    /**
     * Save the response in the database
     * @param aResponseId the id of response that need to be saved
     * @param aResponse the response that need to be saved
     * @param aQuestionId integer that is the id of the question related to the response
     * @param aDiscussionId integer that is the id of the discussion related to the response
     * @returns {Promise<boolean>} true if save went well false otherwise
     */
    async saveResponse(aResponseId, aResponse, aQuestionId, aDiscussionId){
        let saved = true;
        const responseSave = new Response({
            id: aResponseId,
            response: aResponse,
            refQuestion: {
                refQuestion: aQuestionId,
                refDiscussion: aDiscussionId
            }
        });
        // Save the response in database
        await responseSave.save()
            .then(responseSaved => logger.debug(`Response saved ${responseSaved}`))
            .catch(err => {
                logger.debug(`Error when saving Response id = ${aResponseId}`);
                logger.debug(err);
                saved = false;
            });
        return saved;
    }

    /**
     * Remove a question unapproved by the admin from the database
     * @param aQuestionId integer that is the id of the question that has been approved
     * @param aDiscussionId integer that is the id of teh discussion related to the question
     * @returns {Promise<boolean>} true if the remove went well false otherwise
     */
    async unapproveQuestion(aQuestionId, aDiscussionId){
        let questionUser = await this.getUserQuestion(aQuestionId, aDiscussionId);

        // If the question was not found in the database error
        if(questionUser == null){
            logger.debug(`Error when removing question. Question not found`);
            return false;
        }
        // Remove the question in the database
        let remove = await Question.findOneAndDelete({id: aQuestionId, refDiscussion: aDiscussionId}, function (removed) {
            if(removed == null){
                logger.debug(`Question removed`);
            }else{
                logger.debug(`Problem removing the question`);
            }
        });
        if(remove != null){
            return false;
        }
        // Remove the question suggestion from the database
        remove = await QuestionSuggestion.findOneAndDelete({"id.refQuestion": aQuestionId, "id.refDiscussion": aDiscussionId}, function (removed) {
            if(removed == null) {
                logger.debug(`Question Suggestion removed ${removed}`);
            } else {
                logger.debug(`Problem removing the question suggestion`);
            }
        });
        return remove == null;
    }
}

export const dbManager = new DataBaseManager();