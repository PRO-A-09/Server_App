/*
* File: Participant.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a participant
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
const participantSchema = new mongoose.Schema({
    //Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    workPostion: {
        type: String,
        required: true
    }
});

//Instantiation of the model for Participant so it can be used
export const Participant = mongoose.model('Participant', participantSchema);
