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
const ResponseSchema = new mongoose.Schema({
    // Redefinition of the primary key _id to be a Number by default it is a ObjectID
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
        required: true,
        validate: function(v) {
            //Validate will permit us to make some validation before a refQuestion is saved
            //The function check if the id of the value passed exits in the DataBase if yes it will return true otherwise false
            return new Promise(function(resolve, reject) {
                Question.findOne({_id: v}, (err, question) => resolve(question ? true : false));
            });
        }
    },
    //Multiple devices can answer a question so declaration of an array
    devices:[
        {
            refDevice: {
                type: Number,
                ref: 'Device',
                //Validate will permit us to make some validation before a refDevice is saved
                validate: function(v) {
                    return new Promise(function(resolve, reject) {
                        Device.findOne({_id: v}, (err, device) => resolve(device ? true : false));
                    });
                }
            }
        }
    ]
});

//Instantiation of the model for Question so it can be used
export const Response = mongoose.model('Response', ResponseSchema);
