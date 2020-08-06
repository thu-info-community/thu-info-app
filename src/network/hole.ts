import {State, store} from "../redux/store";

const token = () => (store.getState() as State).hole.token;
