import mongoose from 'mongoose';
import {Device} from './modele/Device.js';
import {Discussion} from './modele/Discussion.js';
import {Participant} from './modele/Participant.js';
import {Question} from './modele/Question.js';
import {Response} from './modele/Response.js';
import {Tag} from './modele/Tag.js';
import {Administrator,Moderator,Presentator,UserModerator} from './modele/Users.js';

/**
 * This class is used to manage the database communication.
 */
export class DataBaseManager {

    /**
     * Start the DataBaseManager by connecting to the mongoDB instance
     */
    start() {
        // Connection to the local database
        mongoose.connect('mongodb://localhost:27017/PRO', {useNewUrlParser: true});
    }

    async end(){
        // Close the connection
        await mongoose.disconnect();
    }

    /**
     * Get the password of an administrator
     * @param username String that is the username of the administrator
     * @returns a String that is the result of the request for the password or null if password not found
     */
    async getAdminPassword(username){
        var password = null;
        console.log("Getting the password");
        await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) console.log("Impossible to find username");
            else password = username.password;
        });
        return password;
    }

    /**
     * Get the id of an administrator
     * @param username String that is the username of the administrator
     * @returns a String that represents the id of the user or null if username not found
     */
    async getAdminId(username){
        var id = null;
        console.log("Getting the id");
        await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) console.log("Impossible to find username");
            else id = username._id;
        });
        return id;
    }

    /**
     * Save a discussion in the database
     * @param discussion object Debate that represents the discussion to save in the databse
     * @returns {Promise<boolean>} true if the saving was successful false otherwise
     */
    async saveDiscussion(discussion){
        // Show the Disucssion that will be saved
        console.log(discussion);
        var saved = true;
        // Search for the admin id of the discussion
        let idAdmin = await this.getAdminId(discussion.admin);
        if(idAdmin == null){
            console.log("Error when looking for username id");
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
              .then(discussionSaved => console.log('Discussion saved ' + discussionSaved))
              .catch(err => {
                            console.log("Error when saving Disucssion");
                            console.log(err);
                            saved = false
              });
        console.log("saved = ", saved);
        // If the save function failed exit the function with false
        if(!saved){
            return saved;
        }
        // Save all the questions related to the discussion
        for(var key of discussion.questions.keys()){
            let savedState = await this.saveQuestion(discussion.questions.get(key), discussion.debateID);
            // If one of the questions fail to save exit the function with false
            if(!savedState){
                return false;
            }
        }

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
        var saved = true;
        const questionSave = new Question({
            _id: question.id,
            titreQuestion: question.title,
            numberVotes: 0,
            refDiscussion: idDiscussion
        });
        // Save the question in database
        await questionSave.save()
            .then(questionSaved => console.log("Question saved " + questionSaved))
            .catch(err => {
                console.log("Error when saving Question id = ", question.id);
                console.log(err);
                saved = false;
            });
        // If the save went wrong we exit the function and return false;
        if(!saved){
            return false;
        }
        // Save all the responses related to the question
        for(var key of question.answers.keys()){
            let savedState = await this.saveResponse(question.answers.get(key), question.id);
            if(!savedState){
                return false;
            }
        }
    }

    /**
     * Save the response in the database
     * @param response the response that need to be saved
     * @param questionId integer that is the id of the question related to the response
     * @returns {Promise<boolean>} true if save went well false otherwise
     */
    async saveResponse(response, questionId){
        var saved = true;
        const responseSave = new Response({
            _id: response.key,
            response: response.value,
            refQuestion: questionId
        });
        // Save the discussion in database
        let responseSaved = await responseSave.save()
            .then(responseSaved => console.log("Response saved " + responseSaved))
            .catch(err => {
                console.log("Error when saving Question id = ", response.key);
                console.log(err);
                saved = false;
            });
        if(!saved){
            return false;
        }
    }


}
