/*
* File: Question.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a question
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
const QuestionSchema = new mongoose.Schema({
    //Redefinition of the primary key _id to be a Number by default it is a ObjectID
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
        required: true
    },
    //Multiple tags can be linked to a question so declaration of an array
    tags:[
        {
            refTag: {
                type: Number,
                ref: 'Tag'
            }
        }
    ]
});

//Instantiation of the model for Question so it can be used
export const Question = mongoose.model('Question', QuestionSchema);