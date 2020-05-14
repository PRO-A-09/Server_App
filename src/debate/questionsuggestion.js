

class QuestionSuggestion {
    approved;
    waitingForApproval;
    moderatorRoom;

    constructor(moderatorRoom) {
        this.moderatorRoom = moderatorRoom;
        this.waitingForApproval = [];
        this.moderatorRoom = [];
    }

    newSuggestion(uuid, suggestion) {
        suggestion = {
            uuid: uuid,
            suggestion: suggestion
        };

        this.waitingForApproval.push(suggestion);
        this.moderatorRoom.to('newQuestionSuggestion', suggestion);
    }

    approveSuggestion(uuid) {

    }

    refuseSuggestion(uuid) {

    }

    suggestQuestion = (socket) => (suggestion, callback) => {

    }

    suggestionApproved = (socket) => (question, callback) => {

    }

    suggestionRefused = (socket) => (question, callback) => {

    }

}