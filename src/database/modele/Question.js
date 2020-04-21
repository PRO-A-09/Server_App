/*
* File: Question.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a question
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
import {Discussion} from "./Discussion.js";
import {Tag} from "./Tag.js";
const QuestionSchema = new mongoose.Schema({
    // Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    titreQuestion: {
        type: String,
        required: true
    },
    numberVotes:{
        type: Number,
        required: true
    },
    refDiscussion:{
        type: Number,
        ref: 'Discussion',
        required: true,
        // Validate will permit us to make some validation before a refDiscussion is saved
        // The function check if the id of the value passed exits in the DataBase if yes it will return true otherwise false
        validate: function(v) {
            return new Promise(function(resolve, reject) {
                Discussion.findOne({_id: v}, (err, discussion) => resolve(discussion ? true : false));
            });
        }
    },
    //Multiple tags can be linked to a question so declaration of an array
    tags:[
        {
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
        }
    ]
});

//Instantiation of the model for Question so it can be used
export const Question = mongoose.model('Question', QuestionSchema);
