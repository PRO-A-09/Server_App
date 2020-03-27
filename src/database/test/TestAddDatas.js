/*
* File: TestAddDatas.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
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
import {User} from '../modele/User.js';

import mongoose from 'mongoose';

//Connection to the local database
mongoose.connect('mongodb://localhost:27017/PRO', {useNewUrlParser: true});

//Creation of a particpant and save him in the database
const participant1 = new Participant({_id: 1, name: 'Bill', surname: 'Gates', workPostion: 'CEO'});
participant1.save(function (err) {
    console.log(err);
    //Check if the id 1 already exists of so an error is returned
    Participant.findOne({_id: 1}, function (err) {
        console.log(err)
    });
});

//The following information are written in the same way as participant1
const tag1 = new Tag({_id: 1, name: 'COVID-19'});
tag1.save(function (err) {
    console.log(err);
    Participant.findOne({_id: 1}, function (err) {
        console.log(err)
    });
});

const user1 = new User({login: 'admin', password: 'admin'});
user1.save(function (err) {
    console.log(err);
    Participant.findOne({login: 'admin'}, function (err) {
        console.log(err)
    });
});

const discussion1 = new Discussion({_id: 1, title: 'Coucou', description: 'descri', startTime: '2002-12-09', finishTime: '2002-12-09', participants: [{participantDis: participant1._id}], administrator: user1._id});
discussion1.save(function (err) {
    console.log(err);
    Participant.findOne({_id: 1}, function (err) {
        console.log(err)
    });
});

const question1 = new Question({_id: 1, titreQuestion: 'Que pensez-vous du COVID-19?', numberVotes: 0, refDiscussion: discussion1._id});
question1.save(function (err) {
    console.log(err);
    Participant.findOne({_id: 1}, function (err) {
        console.log(err)
    });
});

const response1 = new Response({_id: 1, response: "Ca va", refQuestion: question1._id});
response1.save(function (err) {
    console.log(err);
    Participant.findOne({_id: 1}, function (err) {
        console.log(err)
    });
});

//mongoose.connection.close()