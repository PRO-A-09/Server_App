import {DataBaseManager} from "../src/database/DatabaseManager.js"
import chai from 'chai';
import {Administrator} from "../src/database/modele/Users.js";
import {Discussion} from "../src/database/modele/Discussion.js";
import {Question} from "../src/database/modele/Question.js";
import {Device} from "../src/database/modele/Device.js";
import {Response} from "../src/database/modele/Response.js";
import {logger} from "../src/conf/config.js";

const expect = chai.expect;
const should = chai.should();

describe('Data Base manager test', () => {
    const db = new DataBaseManager();

    before(async () => {
        db.start();
        let user = null;

        const admin = new Administrator({
            login: 'admin',
            password: 'pass'
        });
        await admin.save().then((userSaved) => {
            logger.debug(`administrator saved : ${userSaved}`);
            user = userSaved;
        });

        const discussion1 = new Discussion({
            _id: 1,
            title: "Debate1",
            description: "My First Debate",
            startTime: new Date(),
            auditors: 50,
            administrator: user._id
        });
        await discussion1.save().then((discussionSaved) => {
            logger.debug(`discussion saved : ${discussionSaved}`);
        });

        const discussion2 = new Discussion({
            _id: 2,
            title: "Debate2",
            description: "My Second Debate",
            startTime: new Date(),
            auditors: 0,
            administrator: user._id
        });
        await discussion2.save().then((discussionSaved) => {
            logger.debug(`discussion saved : ${discussionSaved}`);
        });

        const question1 = new Question({
            id: 1,
            titreQuestion: "Question for debate 1",
            numberVotes: 0,
            refDiscussion: discussion1._id
        });
        await question1.save().then((questionSaved) => {
            logger.debug(`question saved : ${questionSaved}`);
        });

        const question2 = new Question({
            id: 2,
            titreQuestion: "Question 2 for debate 1",
            numberVotes: 0,
            refDiscussion: discussion1._id
        });
        await question2.save().then((questionSaved) => {
            logger.debug(`question saved : ${questionSaved}`);
        });

        const device = new Device({
            _id: "110e8400-e29b-11d4-a716-446655440000"
        });
        await device.save().then((deviceSaved) => {
            logger.debug(`device saved : ${deviceSaved}`);
        });

        const response1 = new Response({
            id: 1,
            response: "Yes",
            refQuestion: {
                refQuestion: question1.id,
                refDiscussion: discussion1._id
            },
            devices: [{
                refDevice: device._id
            }]
        });
        await response1.save().then((responseSaved) => {
            logger.debug(`response saved : ${responseSaved}`);
        });

        const response2 = new Response({
            id: 2,
            response: "No",
            refQuestion: {
                refQuestion: question1.id,
                refDiscussion: discussion1._id
            }
        });
        await response2.save().then((responseSaved) => {
            logger.debug(`response saved : ${responseSaved}`);
        });
    });

    // When testing this function make sure that in your DB the user admin exists
    describe('Get password of user test', () => {
        it('Get password of user admin', (done) => {
            const username = "admin";
            db.getAdminPassword(username).then( function(password) {
                    console.log(password);
                    password.should.equal("pass");
                    done();
                }
            );
        });
    });

    describe('Get debate of user test', () => {
        it('Get debate of user admin', (done) => {
            const username = "admin";
            db.getDiscussionsAdmin(username).then(function(discussions){
                let i = 1;
                for(let disucssion of discussions){
                    disucssion._id.should.equal(i);
                    i++;
                }
                done();
            });
        });
    });

    describe('Get questions from a debate', () => {
        it('Get Question from debate 1', (done) => {
            db.getQuestionsDiscussion(1).then(function(questions){
                let i = 1;
                for(let question of questions){
                    question.id.should.equal(i);
                    i++;
                }
                done();
            });
        });
    });

    describe('Get all responses from a device', () => {
        it('Get Responses from device define', (done) => {
            db.getResponsesDevice("110e8400-e29b-11d4-a716-446655440000").then(function(responses){
                responses[0].id.should.equal(1);
                responses[0].response.should.equal("Yes");
                done();
            });
        });
    });

    describe('Get all responses from a Question', () => {
        it('Get Responses from Question 1', (done) => {
            db.getResponsesQuestion(1).then(function(responses){
                let i = 1;
                for(let response of responses){
                    response.id.should.equal(i);
                    i++;
                }
                done();
            });
        });
    });

    describe('Get last discussion id', () => {
        it('Get last discussion id', (done) => {
            db.getLastDiscussionId()
                .then(id => {
                    id.should.equal(2);
                    done();
                });
        });
    });

    describe('End a debate by saving it in database', () => {
        it('Saving end debate 2', (done) => {
            class myDebate{
                id;
                constructor(id){
                   this.id = id;
                }
            }
            let debate = new myDebate(2);
            db.saveEndDiscussion(debate).then(() => {
                    let updatedDebate = db.getDiscussion(2);
                    updatedDebate.auditeurs = 57;
                    done();
            });

        });
    });

    after((done) => {
        db.end();
        done();
    });
});