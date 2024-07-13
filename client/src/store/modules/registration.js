import $axios from "@/plugins/axios";
import fileSaver from "file-saver";

export const namespaced = true;

export const state = {
  registration: {},
  attendees: [],
};

export const mutations = {
  setRegistration(state, payload) {
    state.registration = payload;
  },
  resetRegistration(state) {
    state.registration = {};
  },
  setAttendees(state, payload) {
    state.attendees = payload;
  },
  updateAttendee(state, payload) {
    const foundIndex = state.attendees.findIndex(
      (item) => item.rId == payload.rId
    );
    if (foundIndex !== -1) {
      state.attendees[foundIndex] = payload;
    }
  },
};

export const actions = {
  addRegistration({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .post("/api/registration/save", request)
        .then((response) => {
          commit("setRegistration", response.data?.payload);
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  setAttendees({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/registration/getAttendeesWcheckin", {
          params: { eventId: request.eventId },
        })
        .then((response) => {
          commit("setAttendees", response.data?.payload);
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  searchAttendees({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/registration/searchAttendees", {
          params: {
            searchKeyword: request.searchKeyword,
            eventId: request.eventId,
          },
        })
        .then((response) => {
          commit("setAttendees", response.data?.payload);
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  downloadAttendees({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/registration/downloadAttendees", {
          params: {
            eventId: request.eventId,
          },
          responseType: "blob",
        })
        .then((response) => {
          const filename = `Attendee-report-event-${
            request.eventId
          }-${new Date().toISOString().slice(0, 19)}.xlsx`;

          const blob = new Blob([response.data], { type: response.data.type });
          fileSaver.saveAs(blob, filename);
          resolve(response);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  sendTicket({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/registration/sendTicket", {
          params: {
            registrationId: request.registrationId,
            eventId: request.eventId,
          },
        })
        .then((response) => {
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};

export const getters = {};
