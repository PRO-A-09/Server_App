import {DataBaseManager} from "../src/database/DatabaseManager.js"
import chai from 'chai';
import {Administrator} from "../src/database/modele/Users.js";

const expect = chai.expect;
const should = chai.should();

describe('Data Base manager test', () => {
    const db = new DataBaseManager();

    before((done) => {
        db.start();
        const admin = new Administrator({
            login: 'admin',
            password: 'pass'
        });
        admin.save().then((userSaved) => {
            console.log("administrator saved : ", userSaved);
            //db.end();
            done();
        });
    });

    // When testing this function make sure that in your DB the user admin exists
    describe('Get password of user test', () => {
        it('Get password of user admin', (done) => {
            const username = "admin";
            db.getAdminPassword(username).then( function(password) {
                    console.log(password);
                    password.should.equal("pass");
                    db.end();
                    done();
                }
            );
        });
    });
});