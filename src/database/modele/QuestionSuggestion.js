/*
* File: QuestionAdmin.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 15 may 2020
* Description: Implement the schema that represents how we want a question proposed by a user
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
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

const QuestionSuggestionSchema = new mongoose.Schema({
    id: {
        type: PrimaryKeyQuestionSchema,
        required: true,
        validate: validatePrimaryKey
    },
    approved:{
        type:Boolean
    }
});

QuestionSuggestionSchema.index({id:1}, {unique: true});
// Instantiation of the model for QuestionSuggestion so it can be used
export const QuestionSuggestion = mongoose.model('QuestionSuggestion', QuestionSuggestionSchema);