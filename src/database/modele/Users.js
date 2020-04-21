/*
* File: Users.js
* Authors: Stéphane Teixeira Carvalho
* Modified by: Stéphane Teixeira Carvalho
* Created on 26 mars 2020
* Description: Implement the schema that represents how we want the users
* to be entered in the MongoDB database
*/
import mongoose from 'mongoose';

import util from 'util';
const Schema = mongoose.Schema;

//Creation of a base Schema that will be used by the different User of our Database
function UserBaseSchema() {
    Schema.apply(this, arguments);

    this.add({
        //The id is not declared here because we want the default id proposed by MongoDB -> ObjectID
        login: {
            type: String,
            required: true
        },
        password:{
            type: String,
            required: true
        }
    });
}

//Make UserBaseSchema inherit from Schema
util.inherits(UserBaseSchema, Schema);

//All the users in your database will use the BaseSchema
const UserSchema = new UserBaseSchema();
const UserModeratorSchema = new UserBaseSchema();
const PresentatorSchema = new UserBaseSchema();

//Creation od a field type that will return the Schema type in UserModerator
//With this function we will be able to show if the user is an administrator or moderator
UserModeratorSchema.virtual('type').get(function () { return this.__t; });

const AdministratorSchema = new UserBaseSchema();
const ModeratorSchema = new UserBaseSchema();

////Instantiation of the models for User, UserModerator, Presentator, Administrator and Moderator so it can be used
export const User = mongoose.model('User', UserSchema);
export const UserModerator = mongoose.model('UserModerator', UserModeratorSchema);
export const Presentator = mongoose.model('Presentator', PresentatorSchema);
// The discriminator option will save administrator and modertaor users in the UserModerator Collection
export const Administrator = UserModerator.discriminator('Administrator', AdministratorSchema);
export const Moderator = UserModerator.discriminator('Moderator', ModeratorSchema);
