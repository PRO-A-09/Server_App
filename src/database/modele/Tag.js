/*
* File: Tag.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a tag
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
const TagSchema = new mongoose.Schema({
    //Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    //Multiple discussion and question can linked the same tag declaration of arrays
    discussions:[
        {
            discussionTag: {type: Number, ref: 'Discussion'}
        }
    ],
    questions:[
        {
            questionTag: {type: Number, ref: 'Question'}
        }
    ]
});

//Instantiation of the model for Tag so it can be used
export const Tag = mongoose.model('Tag', TagSchema);