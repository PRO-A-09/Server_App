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
        }

        /**
         * Format the SuggestedQuestion into a format that can be sent with socket.io
         * @returns {{suggestionId: Number, suggestion: String, votes: Number}} object
         */
        format() {
            return {
                suggestionId: this.suggestionId,
                suggestion: this.question,
                votes: this.getNbVotes()
            };
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
            return Array.from(this.approvedSuggestedQuestions.values(), s => s.format());
        } else {
            return Array.from(this.approvedSuggestedQuestions.values(), s => {
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
    approveSuggestion(suggestionId) {
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

        logger.info(`Suggestion with id (${suggestionId}) has been approved`);
        this.debate.userNamespace.emit('suggestedQuestion', suggestion.format());
        this.debate.adminRoom.emit('newSuggestedQuestion', {
            uuid: suggestion.uuid,
            suggestionId: suggestion.suggestionId,
            suggestion: suggestion.question,
            votes: suggestion.getNbVotes()
        });

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

        // TODO: Emit suggestion deletion to moderator room
        return true;
    }
}
