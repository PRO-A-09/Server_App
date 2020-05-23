/*
* File: Response.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a response
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
import {Device} from "./Device.js";
import {Question} from "./Question.js";
import {Discussion} from "./Discussion.js";

// Create a simple schema to define how the primary is checked in a question
let PrimaryKeyQuestionSchema = {
    refQuestion: {
        type: Number,
        ref: 'Question'
    },
    refDiscussion: {
        type: Number,
        ref: 'Discussion'
    }
};

/**
 * Function that validates the primary key interred in the ResponseSchema
 * @param value value that contains the id of the question and the id of the discussion
 * @returns {Promise<boolean>} true if the question exists false otherwise
 */
function validatePrimaryKey(value){
    return new Promise(function(resolve, reject) {
        Question.findOne({id: value.refQuestion, refDiscussion: value.refDiscussion}, (err, question) => resolve(question ? true : false));
    });
}

const ResponseSchema = new mongoose.Schema({
    // Redefinition of the primary key _id to be a Number by default it is a ObjectID
    id: {
        type: Number,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    refQuestion:{
        type: PrimaryKeyQuestionSchema,
        required: true,
        validate: validatePrimaryKey
    },
    // Multiple devices can answer a question so declaration of an array
    devices:[
        {
            refDevice: {
                type: String,
                ref: 'Device',
                // Validate will permit us to make some validation before a refDevice is saved
                validate: function(v) {
                    return new Promise(function(resolve, reject) {
                        Device.findOne({_id: v}, (err, device) => resolve(device ? true : false));
                    });
                }
            }
        }
    ]
});
ResponseSchema.index({id: 1, refQuestion:1}, {unique: true});
//Instantiation of the model for Question so it can be used
export const Response = mongoose.model('Response', ResponseSchema);
