/*
* File: TestAddDatas.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: File that will try to add multiple information in the database
* This will test if the connection work and if we can add correctly.
*/
import {Participant} from "../modele/Participant.js";
import {Administrator} from "../modele/Users.js";
import {DataBaseManager} from "../dbmanager.js";
import {Debate} from "../../debate/debate.js";

import mongoose from 'mongoose';


// Connection to the local database
mongoose.connect('mongodb://192.168.99.100:27017/PRO', {useNewUrlParser: true});

/**
 * Async function that permits us to wait that the saves finish before continuing testing
 * @returns {Promise<void>} Promise that represent the state of the function
 */
async function test() {
    try {
        // Creation of a participant and save him in the database
        /*const participant1 = new Participant({
            _id: 1,
            name: 'Bill',
            surname: 'Gates',
            workPostion: 'CEO'
        });
        let participantSaved = await participant1.save();
        console.log("participant saved : ", participantSaved);

        const admin = new Administrator({
            login: 'admin',
            password: 'admin'
        });
        let userSaved = await admin.save();
        console.log("administrator saved : ", userSaved);*/

        const db = new DataBaseManager();
        db.getAdminPassword("admin").then( function(password) {
                console.log(password);
            }
        );

        var debate = new Debate("Coucou", "je teste",null,null,null);
        const question = new debate.Question("title", "answers");
        debate.sendNewQuestion(question);
        const question2 = new debate.Question("title", "answers");
        debate.sendNewQuestion(question2);
        const question3 = new debate.Question("title", "answers");
        debate.sendNewQuestion(question3);
        const question4 = new debate.Question("title", "answers");
        debate.sendNewQuestion(question4);

        await db.saveDiscussion(debate);
    }
    catch (err){
        console.log(err);
        console.log("Saved failed");
    }
}

// Run the function to test saving of datas
test();



//mongoose.connection.close()
