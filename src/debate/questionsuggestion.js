import {SocketConfig, logger, DebateConfig} from '../conf/config.js';
import * as TypeCheck from '../utils/typecheck.js'
import {dbManager} from "../database/DatabaseManager.js";

/**
 * This class implements the suggestion of question for a debate
 */
export class QuestionSuggestion {
    debate;
    suggestedQuestions;         // Question not yet approved
    approvedSuggestedQuestions; // Approved suggested questions
    approvalRequired;           // Whether an approval is required or not

    /**
     * Nested class that represents a suggestion
     * @type {QuestionSuggestion.SuggestedQuestion}
     */
    SuggestedQuestion = class SuggestedQuestion {
        static nb_suggestions = 0;

        suggestionId;
        uuid;
        question;
        voters;
        removed;

        /**
         * Default constructor of SuggestedQuestion that stores the question and the uuid
         * of the suggester
         * @param uuid uuid of the device
         * @param question question being suggested
         */
        constructor(uuid, question) {
            this.suggestionId = ++SuggestedQuestion.nb_suggestions;
            this.uuid = uuid;
            this.question = question;
            this.voters = new Set();
            this.removed = false;
        }

        /**
         * Format the SuggestedQuestion into a format that can be sent with socket.io
         * @returns {{suggestionId: Number, suggestion: String, votes: Number, removed: boolean}} object
         */
        format() {
            return {
                suggestionId: this.suggestionId,
                suggestion: this.question,
                votes: this.getNbVotes(),
                removed: this.removed
            };
        }

        /**
         * Format specific to admins
         * @returns {{removed: boolean, suggestionId: Number, suggestion: String, votes: Number, uuid: String}}
         */
        formatAdmin() {
            return{
                uuid: this.uuid,
                suggestionId: this.suggestionId,
                suggestion: this.question,
                votes: this.getNbVotes(),
                removed: this.removed
            }
        }

        /**
         * Returns the number of votes for this suggestion
         * @returns {Number} number of votes
         */
        getNbVotes() {
            return this.voters.size;
        }
    }

    /**
     * Constructor of QuestionSuggestion that takes a debate
     * @param debate debate with which the QuestionSuggestion should interact
     * @param approvalRequired {boolean} whether an approval is required or not
     */
    constructor(debate, approvalRequired) {
        this.approvalRequired = approvalRequired;
        this.debate = debate;
        this.suggestedQuestions = new Map();
        this.approvedSuggestedQuestions = new Map();
    }

    /**
     * Return the list of approved suggestions
     * @param uuid optional, mark the voted suggestion if specified
     * @returns {*[]} array of approved suggested questions
     */
    getApprovedSuggestions(uuid) {
        if (!uuid) {
            return Array.from(this.approvedSuggestedQuestions.values(), s => s.formatAdmin());
        } else {
            return Array.from(this.approvedSuggestedQuestions.values(), s => {
                if (s.removed === true)
                    return;

                let suggestion = s.format();
                if (s.voters.has(uuid))
                    suggestion.voted = true;
                return suggestion;
            });
        }
    }

    /**
     * Register a new suggestion
     * @param uuid uuid of the device making the suggestion
     * @param question suggestion made by the device
     * @returns {boolean|Number} true if the suggestion was added, false otherwise
     */
    newSuggestion(uuid, question) {
        logger.debug(`New suggestion from uuid (${uuid})`);

        // Check suggestion
        if (!TypeCheck.isString(question, DebateConfig.MAX_SUGGESTION_LENGTH)) {
            logger.debug('Suggestion is not a valid string');
            return false;
        }

        let client = this.debate.getClient(uuid);
        if (client.suggestions.size >= DebateConfig.MAX_SUGGESTIONS) {
            logger.debug('Too many suggestions have been submitted');
            return false;
        }

        // Add the suggestion to the client & the list
        let suggestedQuestion = new this.SuggestedQuestion(uuid, question);
        suggestedQuestion.voters.add(uuid);
        client.suggestions.add(suggestedQuestion.suggestionId);
        this.suggestedQuestions.set(suggestedQuestion.suggestionId, suggestedQuestion);

        logger.info(`Device with uuid (${uuid}) suggested (${question}) id (${suggestedQuestion.suggestionId})`);

        // TODO: - Integration with moderator rooms
        if (!this.approvalRequired) {
            logger.info('Approval not required... Calling approveSuggestion.')
            this.approveSuggestion(suggestedQuestion.suggestionId);
        }
        return suggestedQuestion.suggestionId;
    }

    /**
     * Add a vote to a suggested question
     * @param suggestionId id of the suggestion to vote for
     * @param uuid uuid of the device voting for the suggestion
     * @returns {boolean} true if the vote was added, false otherwise
     */
    voteSuggestion(suggestionId, uuid) {
        if (!this.approvedSuggestedQuestions.has(suggestionId)) {
            logger.debug(`Suggestion with id (${suggestionId}) does not exist or is not approved`);
            return false;
        }

        let suggestion = this.approvedSuggestedQuestions.get(suggestionId);
        if (suggestion.voters.has(uuid)) {
            logger.debug(`Device with uuid (${uuid}) has already voted for suggestion with id (${suggestionId})`);
            return false;
        }

        logger.debug(`Device with uuid (${uuid}) voted for suggestion with id (${suggestionId})`);
        suggestion.voters.add(uuid);
        this.debate.userNamespace.emit('newVote', suggestion.suggestionId);
        this.debate.adminRoom.emit('newVote', suggestion.suggestionId);

        return true;
    }

    /**
     * Approve a suggestion and send it to the clients
     * @param suggestionId id of the suggestion to approve
     * @returns {boolean} true if the suggestion was successfully approved, false otherwise
     */
    async approveSuggestion(suggestionId) {
        logger.debug(`Approving suggestion with id (${suggestionId})`);
        if (!this.suggestedQuestions.has(suggestionId)) {
            logger.debug(`Suggestion with id (${suggestionId}) does not exist`);
            return false;
        }

        if (this.approvedSuggestedQuestions.has(suggestionId)) {
            logger.debug(`Suggestion with id (${suggestionId}) has already been approved`);
            return false;
        }

        let suggestion = this.suggestedQuestions.get(suggestionId);
        this.approvedSuggestedQuestions.set(suggestionId, suggestion);
        this.suggestedQuestions.delete(suggestionId);

        await dbManager.saveQuestionUser(suggestion, this.debate.debateID)
            .then(res => {
                if (res === true) {
                    logger.info('Question saved to db');
                } else {
                    logger.warn('Cannot save question to db');
                }
            })
            .catch(res => {
                logger.error(`saveQuestionUser threw : ${res}.`)
            });

        logger.info(`Suggestion with id (${suggestionId}) has been approved`);
        this.debate.userNamespace.emit('suggestedQuestion', suggestion.format());
        this.debate.adminRoom.emit('newSuggestedQuestion', suggestion.formatAdmin());

        return true;
    }

    /**
     * Reject a suggestion
     * @param suggestionId id of the suggestion to reject
     * @returns {boolean} true if the suggestion was successfully rejected, false otherwise
     */
    rejectSuggestion(suggestionId) {
        logger.debug(`Rejecting suggestion with id (${suggestionId})`);

        if (!this.suggestedQuestions.has(suggestionId)) {
            logger.debug(`Suggestion with id (${suggestionId}) does not exist`);
            return false;
        }

        // Remove the suggestion from the client & the list
        let suggestion = this.suggestedQuestions.get(suggestionId);
        this.debate.getClient(suggestion.uuid).suggestions.delete(suggestionId);
        this.suggestedQuestions.delete(suggestionId);

        logger.info(`Suggestion with id (${suggestionId}) has been rejected`);
        this.debate.adminRoom.emit('rejectedSuggestion', suggestionId);
        return true;
    }

    /**
     * Should mark all suggestions of the client as removed
     * @param uuid uuid of the client
     */
    removeDeviceSuggestions(uuid) {
        logger.info(`Removing suggestions from device with uuid (${uuid})`);
        let clientSuggestions = this.debate.getClient(uuid).suggestions;

        for (let suggestionId of clientSuggestions) {
            this.debate.userNamespace.emit('deletedSuggestion', suggestionId);
            this.debate.adminRoom.emit('deletedSuggestion', suggestionId);
            let suggestion = this.approvedSuggestedQuestions.get(suggestionId);
            if (suggestion == null) {
                logger.error(`Trying to remove a suggestion that does not exist.`);
            } else {
                suggestion.removed = true;
            }
        }
    }
}
