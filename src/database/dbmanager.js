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

    async getAdminPassword(username){
        let admin = await Administrator.findOne({login:username},function(err,username) {
            if (err || username == null) console.log("Failed");
        });
        return admin.password;
    }

    async saveDisucssion(discussion){
        const discussion1 = new Discussion({
            _id: 1,
            title: 'Coucou',
            description: 'descri',
            startTime: '2002-12-09',
            finishTime: '2002-12-09',
            participants: [{refParticipant: 1}],
            administrator: admin._id
        });
        //Save the discussion in database
        let discussionSaved = await discussion1.save();
        console.log("discussion saved : ", discussionSaved);
    }
}