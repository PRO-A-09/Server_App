import mongoose from 'mongoose';
import {Device} from './modele/Device.js';
import {Discussion} from './modele/Discussion.js';
import {Participant} from './modele/Participant.js';
import {Question} from './modele/Question.js';
import {Response} from './modele/Response.js';
import {Tag} from './modele/Tag.js';
import {Administrator,Moderator,Presentator,UserModerator} from './modele/Users.js';

/**
 * This class is used to manage the database commuication.
 */
export class DataBaseManager {

    /**
     * Start the DataBaseManager
     */
    start() {
        //Connection to the local database
        mongoose.connect('mongodb://192.168.99.100:27017/PRO', {useNewUrlParser: true});
    }

    /**
     * Get the password of an administrator
     * @param username String that is the username of the administrator
     * @returns a String that is the result of the request for the password
     */
    async getAdminPassword(username){
        let admin = await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) console.log("Failed");
        });
        return admin.password;
    }

    /**
     * Get the id of an administrator
     * @param username String that is the username of the administrator
     * @returns a ObjectID that is the result of the request for the password
     */
    async getAdminId(username){
        let admin = await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) console.log("Failed");
        });
        return admin._id;
    }

    /**
     *
     * @param discussion
     * @returns {Promise<void>}
     */
    async saveDiscussion(discussion){
        console.log(discussion);
        //Search for the admin id
        let idAdmin = await this.getAdminId(discussion.admin);
        /*Permet d'enregistrer des participants
        var arr = [];
        for(var key of discussion.participant.keys()){
            arr.push({refParticipant: key });
        }
        */
        console.log(discussion.debateID);
        const discussion1 = new Discussion({
            _id: discussion.debateID,
            title: discussion.title,
            description: discussion.description,
            startTime: new Date(),
            administrator: idAdmin
        });
        //Save the discussion in database
        let discussionSaved = await discussion1.save();
        console.log("discussion saved : ", discussionSaved);

        //Save all the questions related to the discussion
        for(var key of discussion.questions.keys()){
            await this.saveQuestion(discussion.questions.get(key), discussion.debateID);
        }

        //Pour ajouter la temps à laquelle la disuccsion s'est terminé
        discussion1.finishTime = new Date();
        await discussion1.save();
    }

    /**
     *
     * @param question
     * @param idDiscussion
     * @returns {Promise<void>}
     */
    async saveQuestion(question, idDiscussion){
        console.log(question.answers);
        const questionSave = new Question({
            _id: question.id,
            titreQuestion: question.title,
            numberVotes: 0,
            refDiscussion: idDiscussion
        });
        //Save the discussion in database
        let questionSaved = await questionSave.save();
        //Save all the responses related to the question
        for(var key of question.answers.keys()){
            await this.saveResponse(question.answers.get(key), question.id);
        }
        console.log("question saved : ", questionSaved);
    }

    /**
     *
     * @param response
     * @param questionId
     * @returns {Promise<void>}
     */
    async saveResponse(response, questionId){
        const responseSave = new Response({
            _id: response.key,
            response: response.value,
            refQuestion: questionId
        });
        //Save the discussion in database
        let responseSaved = await responseSave.save();
        console.log("response saved : ", responseSaved);
    }
}