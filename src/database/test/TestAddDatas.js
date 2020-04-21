/*
* File: TestAddDatas.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: File that will try to add multiple information in the database
* This will test if the connection work and if we can add correctly.
*/
import {Device} from '../modele/Device.js';
import {Discussion} from '../modele/Discussion.js';
import {Participant} from '../modele/Participant.js';
import {Question} from '../modele/Question.js';
import {Response} from '../modele/Response.js';
import {Tag} from '../modele/Tag.js';
import {Administrator,Moderator,Presentator,UserModerator} from '../modele/Users.js';

import mongoose from 'mongoose';

// Connection to the local database
mongoose.connect('mongodb://192.168.99.100:27017/PRO', {useNewUrlParser: true});

/**
 * Async function that permits us to wait that the saves finish before continuing testing
 * @returns {Promise<void>} Promise that represent the state of the function
 */
async function test() {
    try {
        //Creation of a participant and save him in the database
        const participant1 = new Participant({
            _id: 1,
            name: 'Bill',
            surname: 'Gates',
            workPostion: 'CEO'
        });
        let participantSaved = await participant1.save();
        console.log("participant saved : ", participantSaved);

        //The following information are written in the same way as participant1
        const tag1 = new Tag({
            _id: 1,
            name: 'COVID-19'
        });
        let tagSaved = await tag1.save();
        console.log("tag saved : ", tagSaved);

        const admin = new Administrator({
            login: 'admin',
            password: 'admin'
        });
        let userSaved = await admin.save();
        console.log("administrator saved : ", userSaved);

        const moderator = new Moderator({
            login: 'admin',
            password: 'admin'
        });
        let user2Saved = await moderator.save();
        console.log("moderator saved : ", user2Saved);

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

        const discussion2 = new Discussion({
            _id: 2,
            title: 'Coucou',
            description: 'descri',
            startTime: '2002-12-09',
            finishTime: '2002-12-09',
            participants: [{refParticipant: 1}],
            administrator: moderator._id
        });
        //This validation will fail because a moderator created the discussion
        await discussion2.validate(async function (err) {
            if (err) {
                console.log("Discussion is not valid to be saved");
            }
            else {
                console.log("Disucssion is valid to be saved");
            }
        });

        const question1 = new Question({
            _id: 1,
            titreQuestion: 'Que pensez-vous du COVID-19?',
            numberVotes: 0,
            refDiscussion: discussion1._id
        });
       let questionSaved = await question1.save();
       console.log("question saved : ", questionSaved);

        const response1 = new Response({
            _id: 1,
            response: "Ca va",
            refQuestion: question1._id
        });
        let responseSaved = await response1.save();
        console.log("response saved : ", responseSaved);
    }
    catch (err){
        console.log(err);
        console.log("Saved failed");
    }
}

//Run the function to test saving of datas
test();

//mongoose.connection.close()
