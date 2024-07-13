import $axios from "@/plugins/axios";

export const namespaced = true;

export const state = {
  events: [],
  event: {},
};

export const mutations = {
  setEvents(state, payload) {
    state.events = payload;
  },
  setEvent(state, payload) {
    state.event = payload;
  },
  saveEvent(state, payload) {
    const foundIndex = state.events.findIndex((item) => item.id == payload.id);
    if (foundIndex !== -1) {
      state.events[foundIndex] = payload;
    } else {
      state.events.unshift(payload);
    }
  },
  removeEvent(state, payload) {
    const foundIndex = state.events.findIndex(
      (item) => item.id == payload.eventId
    );
    if (foundIndex !== -1) {
      state.events.splice(foundIndex, 1);
    }
  },
};

export const actions = {
  setEvents({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/event/getAllEvents", { params: { clubId: request } })
        .then((response) => {
          commit("setEvents", response.data?.payload);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  setActiveEvents({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/event/getAllActiveEvents", {
          params: {
            clubId: request.clubId,
            currentDate: request.currentDate,
          },
        })
        .then((response) => {
          commit("setEvents", response.data?.payload);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  setEventByEventIdnClubId({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/event/getEventByEventIdnClubId", {
          params: { eventId: request },
        })
        .then((response) => {
          commit("setEvent", response.data?.payload);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  save({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .post("/api/event/save", request)
        .then((response) => {
          commit("saveEvent", response.data?.payload);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  removeEvent({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/event/removeEvent", {
          params: { eventId: request.eventId },
        })
        .then((response) => {
          commit("removeEvent", request);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};

export const getters = {
  getEventById: (state) => (id) => {
    return state.events.find((item) => item.id == id);
  },
};
