/*
* File: Discussion.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a discussion
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
import {Participant} from "./Participant.js";
import {Administrator} from "./Users.js";

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
            required: true,
            //Validate will permit us to make some validation before a refParticipant is saved
            //The function check if the id of the value passed exits in the DataBase if yes it will return true otherwise false
            validate: function(v) {
                return new Promise(function(resolve, reject) {
                    Participant.findOne({_id: v}, (err, participant) => resolve(participant ? true : false));
                });
            }
        }
    }],
    tags: [{
        refTag: {
            type: Number,
            ref: 'Tag',
            //Validate will permit us to make some validation before a refTag is saved
            validate: function(v) {
                return new Promise(function(resolve, reject) {
                    Tag.findOne({_id: v}, (err, tag) => resolve(tag ? true : false));
                });
            }
        }
    }],
    administrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Administrator',
        required: true,
        //Validate will permit us to make some validation before a reference to an administrator is saved
        validate: function(v) {
            return new Promise(function(resolve, reject) {
                Administrator.findOne({_id: v}, (err, admin) => resolve(admin ? true : false));
            });
        }
    }
});

//Instantiation of the model for Discussion so it can be used
export const Discussion = mongoose.model('Discussion', DiscussionSchema);