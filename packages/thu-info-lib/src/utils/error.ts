export class LibError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export class LoginError extends LibError {
    constructor(message?: string) {
        super(message);
    }
}

export class UrlError extends LibError {

}

export class ReportError extends LibError {
    constructor(message?: string) {
        super(message);
    }
}

export class AssessmentError extends LibError {
    constructor(message?: string) {
        super(message);
    }
}

export class ClassroomStateError extends LibError {

}

export class LoseCardError extends LibError {

}

export class EleError extends LibError {

}

export class LibraryError extends LibError {
    constructor(message?: string) {
        super(message);
    }
}

export class SportsError extends LibError {
    constructor(message?: string) {
        super(message);
    }
}

export class DormAuthError extends LibError {

}

export class IdAuthError extends LibError {

}

export class CabError extends LibError {

}

export class UserInfoError extends LibError {

}

export class ResponseStatusError extends LibError {
    constructor(message?: string) {
        super(message);
    }
}

export class GitLabApiError extends LibError {

}

export class ScheduleError extends LibError {

}

export class CrError extends LibError {

}

export class CrCaptchaError extends CrError {

}
