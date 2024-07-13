import $axios from "@/plugins/axios";

export const namespaced = true;

export const state = {
  statistics: {
    historicalRegistrationCount: 0,
    historicalCheckinCount: 0,
    totalRegistrationCount: 0,
    totalCheckinCount: 0,
  },
};

export const mutations = {
  setStatistics(state, payload) {
    Object.assign(state.statistics, payload);
  },
};

export const actions = {
  scanByRegistrationId({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .post("/api/checkin/scanByRegistrationId", { payload: request })
        .then((response) => {
          // commit("setRegistration", response.data?.payload);
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  updateCheckinStatus({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .post("/api/checkin/save", {
          payload: {
            id: request.editingAttendee.cId,
            checkinStatus: request.editingAttendee.checkinStatus,
            registrationId: request.editingAttendee.rId,
          },
          eventId: request.eventId,
        })
        .then((response) => {
          commit(
            "registration/updateAttendee",
            {
              ...request.editingAttendee,
              ...response.data?.payload,
              cId: response.data?.payload.id,
            },
            { root: true }
          );
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
  setStatistics({ commit }, request) {
    return new Promise((resolve, reject) => {
      $axios
        .get("/api/checkin/getStatistics", {
          params: { eventId: request.eventId, date: request.date },
        })
        .then((response) => {
          commit("setStatistics", response.data?.payload);
          resolve(response.data?.payload);
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};

export const getters = {};
