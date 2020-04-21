/*
* File: Device.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a device
* to be entered in the MongoDB database
*/

import mongoose from 'mongoose';
import {UserModerator} from "./Users.js";

// Creation of the schema that will permit us to define how we want a device to be entered
const DeviceSchema = new mongoose.Schema({
    //Redefinition of the primary key _id to be a Number by default it is a ObjectID
    _id: {
        type: Number,
        required: true
    },
    //Will be a reference to the ObjectID(primary key) of a user
    refModerator:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserModerator',
        //Validate will permit us to make some validation before a refModertaor is saved
        //The function check if the id of the value passed exits in the DataBase if yes it will return true otherwise false
        validate: function(v) {
            return new Promise(function(resolve, reject) {
                UserModerator.findOne({_id: v}, (err, userM) => resolve(userM ? true : false));
            });
        }
    },
});

//Instantiation of the model for Device so it can be used
export const Device = mongoose.model('Device', DeviceSchema);
