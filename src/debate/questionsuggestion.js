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
        votes;

        constructor(uuid, suggestion) {
            this.id = ++SuggestedQuestion.nb_suggestions;
            this.uuid = uuid;
            this.suggestion = suggestion;
            this.votes = 0;
        }

        format() {
            return {
                id: this.id,
                suggestion: this.suggestion,
                votes: this.votes
            };
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
     * @returns {boolean} true if the suggestion was added, false otherwise
     */
    newSuggestion(uuid, suggestion) {
        logger.debug(`New suggestion from uuid (${uuid})`);

        // Check suggestion
        if (!TypeCheck.isString(suggestion, DebateConfig.MAX_QUESTION_LENGTH)) {
            logger.debug('Suggestion is not a valid string');
            return false;
        }

        let suggestedQuestion = new this.SuggestedQuestion(uuid, suggestion);
        this.suggestedQuestions.set(suggestedQuestion.id, suggestedQuestion);
        logger.info(`Device with uuid (${uuid}) suggested (${suggestion}) id (${suggestedQuestion.id})`);

        // TODO: - Integration with moderator rooms
        //       - Remove automatic approval.

        if (!this.approvalRequired) {
            logger.info('Approval not required... Calling approveSuggestion.')
            this.approveSuggestion(suggestedQuestion.id);
        }
        return true;
    }

    /**
     * Add a vote to a suggested question
     * @param suggestionId id of the suggestion to vote for
     * @returns {boolean} true if the vote was added, false otherwise
     */
    voteSuggestion(suggestionId) {
        if (!this.approvedSuggestedQuestions.has(suggestionId)) {
            logger.debug(`Suggestion with id (${suggestionId}) does not exist or is not approved`);
            return false;
        }

        logger.debug(`Device with uuid (${uuid}) voted for suggestion with id (${suggestionId})`);
        let suggestion = this.approvedSuggestedQuestions.get(suggestionId);
        ++suggestion.votes;
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

        logger.info(`Suggestion with id (${suggestionId}) has been rejected`);
        this.suggestedQuestions.delete(suggestionId);

        // TODO: Emit suggestion deletion to moderator room
        return true;
    }
}
