import { createStore } from "vuex";
import * as user from "./modules/user";
import * as club from "./modules/club";
import * as event from "./modules/event";
import * as registration from "./modules/registration";
import * as appUser from "./modules/appUser";

const store = createStore({
  modules: {
    user,
    club,
    registration,
    event,
    appUser,
  },
  state: () => ({
    progress: null,
    routeInfo: {},
  }),
  mutations: {
    setProgress(state, payload) {
      state.progress = payload;
    },
    setRouteInfo(state, payload) {
      state.routeInfo = payload;
    },
  },
  actions: {},
});

export default store;
