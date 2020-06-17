import {applyMiddleware, createStore} from "redux";
import thunk from "redux-thunk";
import {AuthState} from "./states/auth";
import {combineReducers} from "redux";
import {fullName} from "./reducers/basics";
import {auth} from "./reducers/auth";

export interface State {
	auth: AuthState;
	fullName: string;
}

export const reducers = combineReducers({
	auth,
	fullName,
});

export const store = createStore(reducers, applyMiddleware(thunk));
