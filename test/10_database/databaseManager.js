import {DataBaseManager} from "../../src/database/DatabaseManager.js"
import chai from 'chai';
import {Administrator} from "../../src/database/modele/Users.js";
import {Discussion} from "../../src/database/modele/Discussion.js";
import {Question} from "../../src/database/modele/Question.js";
import {QuestionAdmin} from "../../src/database/modele/QuestionAdmin.js";
import {QuestionSuggestion} from "../../src/database/modele/QuestionSuggestion.js";
import {Device} from "../../src/database/modele/Device.js";
import {Response} from "../../src/database/modele/Response.js";
import {logger} from "../../src/conf/config.js";

const expect = chai.expect;
const should = chai.should();

describe('Data Base manager test', () => {
    const db = new DataBaseManager();

    before(async () => {
        await db.start();
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

        const questionAdmin = new QuestionAdmin({
           id:{
               refQuestion: question1.id,
               refDiscussion: discussion1._id
           },
            administrator: user._id
        });
        await questionAdmin.save().then((questionSaved) => {
            logger.debug(`question of admin saved : ${questionSaved}`);
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

        const questionSuggestion = new QuestionSuggestion({
            id:{
                refQuestion: question2.id,
                refDiscussion: discussion1._id
            }
        });
        await questionSuggestion.save().then((questionSaved) => {
            logger.debug(`question of user saved : ${questionSaved}`);
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
            db.saveEndDiscussion(2).then(() => {
                let updatedDebate = db.getDiscussion(2);
                updatedDebate.auditeurs = 57;
                done();
            });

        });
    });

    describe('Get ended debate of an admin', () => {
        it('Get ended debates', (done) => {
            db.getClosedDiscussionsAdmin("admin").then((discussions) => {
                discussions.length.should.equal(1);
                discussions[0]._id.should.equal(2);
                done();
            });

        });
    });

    describe('Save a question of an admin', () => {
        it('Saving new Question', (done) => {
            class myQuestion{
                id;
                title;
                answers;
                constructor(id, title){
                    this.id = id;
                    this.title = title;
                    this.answers = [];
                }
            }
            let question = new myQuestion(3, "My admin question is good?");
            db.saveQuestionAdmin(question, 2, "admin").then(async () => {
                done();
            });

        });
    });

    describe('Save a question of a user', () => {
        it('Saving new Question', (done) => {
            class myQuestion{
                id;
                title;
                answers;
                constructor(id, title){
                    this.id = id;
                    this.title = title;
                    this.answers = [];
                }
            }
            let question = new myQuestion(3, "My user question is good?");
            let question2 = new myQuestion(4, "My user question is not good right?");
            db.saveQuestionUser(question, 1).then((statusSave) => {
                if(statusSave) {
                    db.saveQuestionUser(question2, 1).then((statusSave) => {
                        if (statusSave) {
                            done();
                        }
                    });
                }
            });

        });
    });

    describe('Save a question that as been approved by admin', () => {
        it('Saving approved Question', (done) => {
            db.saveApprovedQuestion(3, 1).then((statusSave) => {
                if(statusSave){
                    done();
                }
            });

        });
    });

    describe('Get questions that as been approved by admin', () => {
        it('Getting approved Question', (done) => {
            db.getAcceptedQuestionsSuggestion( 1).then((questions) => {
                questions.length.should.above(0);
                for(let question of questions){
                    question.id.refDiscussion.should.equal(1);
                    question.approved.should.equal(true);
                }
                done();
            });

        });
    });

    describe('Get questions that as not yet been approved by admin', () => {
        it('Getting unapproved Question', (done) => {
            db.getNotYetAcceptedQuestionsSuggestion( 1).then((questions) => {
                questions.length.should.above(0);
                for(let question of questions){
                    question.id.refDiscussion.should.equal(1);
                    (question.approved === undefined).should.be.true;
                }
                done();
            });

        });
    });

    describe('Remove question unaccepted', () => {
        it('Remove unapproved Question', (done) => {
            db.removeQuestionSuggestion( 2, 1).then((remove) => {
                if(remove) {
                    done();
                }
            });

        });
    });

    after((done) => {
        db.end();
        done();
    });
});