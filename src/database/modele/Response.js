/*
* File: Response.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a response
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
const ResponseSchema = new mongoose.Schema({
    //Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    response: {
        type: String,
        required: true
    },
    refQuestion:{
        type: Number,
        ref: 'Question',
        required: true
    },
    //Multiple devices can answer a question so declaration of an array
    devices:[
        {
            refDevice: {
                type: Number,
                ref: 'Device'
            }
        }
    ]
});

//Instantiation of the model for Question so it can be used
export const Response = mongoose.model('Response', ResponseSchema);