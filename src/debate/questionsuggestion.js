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

    SuggestedQuestion = class SuggestedQuestion {
        static nb_suggestions = 0;

        id;
        uuid;
        suggestion;
        voters;

        constructor(uuid, suggestion) {
            this.id = ++SuggestedQuestion.nb_suggestions;
            this.uuid = uuid;
            this.suggestion = suggestion;
            this.voters = new Set();
        }

        format() {
            return {
                id: this.id,
                suggestion: this.suggestion,
                votes: this.getNbVotes()
            };
        }

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
     * Register a new suggestion
     * @param uuid uuid of the device making the suggestion
     * @param suggestion suggestion made by the device
     * @returns {boolean|Number} true if the suggestion was added, false otherwise
     */
    newSuggestion(uuid, suggestion) {
        logger.debug(`New suggestion from uuid (${uuid})`);

        // Check suggestion
        if (!TypeCheck.isString(suggestion, DebateConfig.MAX_SUGGESTION_LENGTH)) {
            logger.debug('Suggestion is not a valid string');
            return false;
        }

        let client = this.debate.getClient(uuid);
        if (client.suggestions.size >= DebateConfig.MAX_SUGGESTIONS) {
            logger.debug('Too many suggestions have been submitted');
            return false;
        }

        // Add the suggestion to the client & the list
        let suggestedQuestion = new this.SuggestedQuestion(uuid, suggestion);
        suggestedQuestion.voters.add(uuid);
        client.suggestions.add(suggestedQuestion.id);
        this.suggestedQuestions.set(suggestedQuestion.id, suggestedQuestion);

        logger.info(`Device with uuid (${uuid}) suggested (${suggestion}) id (${suggestedQuestion.id})`);

        // TODO: - Integration with moderator rooms
        if (!this.approvalRequired) {
            logger.info('Approval not required... Calling approveSuggestion.')
            this.approveSuggestion(suggestedQuestion.id);
        }
        return suggestedQuestion.id;
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
