/*
* File: QuestionAdmin.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 15 may 2020
* Description: Implement the schema that represents how we want a question proposed by an admin
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
import {Administrator} from "./Users.js";
import {Question} from "./Question.js";
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

const QuestionAdminSchema = new mongoose.Schema({
    id: {
        type: PrimaryKeyQuestionSchema,
        required: true,
        validate: validatePrimaryKey
    },
    // Redefinition of the primary key _id to be a Number by default it is a ObjectID
    administrator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Administrator',
        required: true,
        //Validate will permit us to make some validation before a reference to an administrator is saved
        validate: function (v) {
            return new Promise(function (resolve, reject) {
                Administrator.findOne({_id: v}, (err, admin) => resolve(admin ? true : false));
            });
        }
    }
});

QuestionAdminSchema.index({id:1}, {unique: true});
// Instantiation of the model for QuestionAdmin so it can be used
export const QuestionAdmin = mongoose.model('QuestionAdmin', QuestionAdminSchema);