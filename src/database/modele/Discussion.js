/*
* File: Discussion.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a discussion
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';

//Creation of the schema that will permit us to define how we want a discussion to be entered
const DiscussionSchema = new mongoose.Schema({
    //Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    finishTime: {
        type: Date,
        required: true
    },
    //Multiple participants can be part of a discussion so declaration of an array
    participants: [{
        refParticipant: {
            type: Number,
            ref: 'Participant',
            required: true
        }
    }],
    tags: [{
        refTag: {
            type: Number,
            ref: 'Tag'
        }
    }],
    administrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

//Instantiation of the model for Discussion so it can be used
export const Discussion = mongoose.model('Discussion', DiscussionSchema);