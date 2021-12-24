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

}

export class SportsError extends LibError {

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
