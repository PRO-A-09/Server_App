/*
* File: User.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: -
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want a user
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';
//The id is not declared here because we want the default id proposed by MongoDB -> ObjectID
const UserSchema = new mongoose.Schema({
    login: {
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    }
});

//Instantiation of the model for User so it can be used
export const User = mongoose.model('User', UserSchema);