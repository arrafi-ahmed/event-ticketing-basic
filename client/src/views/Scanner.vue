<script setup>
import PageTitle from "@/components/PageTitle.vue";
import { computed, reactive, ref } from "vue";
import { useStore } from "vuex";
import { QrcodeStream } from "vue-qrcode-reader";
import { useRoute } from "vue-router";
import { formatDateTime } from "@/others/util";

const store = useStore();
const route = useRoute();

// const qrScannerDialog = ref(false);
const isPaused = ref(false);

const event = computed(() =>
  store.getters["event/getEventById"](route.params.eventId)
);
const attendee = reactive({});
const handleScan = async ([decodedString]) => {
  isPaused.value = true; // pause the camera stream

  await store
    .dispatch("checkin/scanByRegistrationId", {
      qrCodeData: decodedString.rawValue,
      eventId: route.params.eventId,
    })
    .then((result) => {
      Object.assign(attendee, { ...result });
    })
    .catch((err) => {
      Object.assign(attendee, { ...err.response.data?.payload });
    })
    .finally(() => {
      isPaused.value = false;
    });
};
const onError = (err) => {
  console.error(99, err);
};
</script>
<template>
  <v-container>
    <v-row align="start">
      <v-col>
        <page-title
          :sub-title="event?.name"
          justify="space-between"
          title="Scanner"
        >
          <v-btn
            icon="mdi-arrow-left"
            variant="text"
            @click="$router.back()"
          ></v-btn>
        </page-title>
      </v-col>
    </v-row>

    <v-row align="center" class="fill-height" justify="center" no-gutters>
      <v-col cols="12" lg="6" md="8" sm="10">
        <v-card class="bg-tertiary">
          <v-card-title>Scan QR Code</v-card-title>
          <v-card-text>
            <qrcode-stream
              :paused="isPaused"
              @detect="handleScan"
              @error="onError"
            ></qrcode-stream>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row
      align="center"
      class="fill-height mt-2 mt-md-4"
      justify="center"
      no-gutters
    >
      <v-col cols="12" lg="6" md="8" sm="10">
        <!--        show customer details-->
        <v-card>
          <v-card-title>Attendee Details</v-card-title>
          <v-card-text>
            <v-table v-if="attendee.registrationData" density="compact">
              <tbody>
                <tr>
                  <td class="rowTitle">Name</td>
                  <td>
                    {{ attendee.registrationData?.name }}
                  </td>
                </tr>
                <tr>
                  <td class="rowTitle">Email</td>
                  <td>
                    {{ attendee.registrationData?.email }}
                  </td>
                </tr>
                <tr>
                  <td class="rowTitle">Phone</td>
                  <td>
                    {{ attendee.registrationData?.phone }}
                  </td>
                </tr>
                <tr>
                  <td class="rowTitle">Registration Time</td>
                  <td>
                    {{ formatDateTime(attendee.registrationTime) }}
                  </td>
                </tr>
                <tr>
                  <td class="rowTitle">Checkin Time</td>
                  <td>
                    {{
                      attendee.checkinTime
                        ? formatDateTime(attendee.checkinTime)
                        : "Pending"
                    }}
                  </td>
                </tr>
              </tbody>
            </v-table>

            <v-alert v-else border="start" closable density="compact"
              >No attendee scanned yet!
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
