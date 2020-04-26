import {DataBaseManager} from "../src/database/DatabaseManager.js"
import chai from 'chai';

const expect = chai.expect;
const should = chai.should();

describe('Data Base manager test', () => {
    const db = new DataBaseManager();

    before(() => {
        db.start();
    });

    // When testing this function make sure that in your DB the user admin exists
    describe('Get password of user test', () => {
        it('Get password of user admin', () => {
            const username = "admin";
            db.getAdminPassword(username).then( function(password) {
                    password.should.equal("admin");
                }
            );
        });
    });
});