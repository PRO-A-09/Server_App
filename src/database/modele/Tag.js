/*
* File: Tag.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a tag
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
import {Question} from "./Question.js";
import {Discussion} from "./Discussion.js";
const TagSchema = new mongoose.Schema({
    // Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    // Multiple discussion and question can linked the same tag declaration of arrays
    discussions:[
        {
            discussionTag: {
                type: Number,
                ref: 'Discussion',
                //Validate will permit us to make some validation before a dicussionTag is saved
                //The function check if the id of the value passed exits in the DataBase if yes it will return true otherwise false
                validate: function(v) {
                    return new Promise(function(resolve, reject) {
                        Discussion.findOne({_id: v}, (err, discussion) => resolve(discussion ? true : false));
                    });
                }
            }
        }
    ],
    questions:[
        {
            questionTag: {
                type: Number,
                ref: 'Question',
                //Validate will permit us to make some validation before a questionTag is saved
                validate: function(v) {
                    return new Promise(function(resolve, reject) {
                        Question.findOne({_id: v}, (err, question) => resolve(question ? true : false));
                    });
                }
            }
        }
    ]
});

//Instantiation of the model for Tag so it can be used
export const Tag = mongoose.model('Tag', TagSchema);
