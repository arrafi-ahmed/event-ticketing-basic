<script setup>
import { computed, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { clientBaseUrl, sendToWhatsapp } from "@/others/util";
import { useStore } from "vuex";
import QRCodeVue3 from "qrcode-vue3";
import { useTheme } from "vuetify";
import Logo from "@/components/Logo.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();
const theme = useTheme();

const club = computed(() => store.state.club.club);
const registration = computed(() => store.state.registration.registration);

const qrCode = computed(() => {
  return JSON.stringify({
    id: registration.value?.id,
    qrUuid: registration.value?.qrUuid,
  });
});

const qrOptions = {
  type: "dot",
  color: theme.global.current.value.colors.primary,
};

const handleSendToWhatsapp = () => {
  const phone = registration.value.registrationData.phone.slice(1);
  const message = `QR code download link: ${clientBaseUrl}/qr/${registration.value.id}/${registration.value.qrUuid}`;
  sendToWhatsapp(phone, message);
};
onMounted(() => {
  if (!club.value.id) store.dispatch("club/setClub", route.params.clubId);
});
onUnmounted(() => {
  store.commit("registration/resetRegistration");
});
</script>
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="5" sm="6">
        <logo
          :img-src-api="{ name: club.logo, type: 'club-logo' }"
          :max-height="100"
          :max-width="300"
          :title="!club.logo ? club.name : null"
          container-class="clickable"
          img-class="mx-auto"
          @click="
            router.push({
              name: 'club-single',
              params: { clubId: route.params.clubId },
            })
          "
        ></logo>
        <v-card
          v-if="registration.id"
          class="mx-auto pa-2 my-2 rounded-xl bg-transparent"
          color=""
          elevation="0"
          max-width="500"
          variant="flat"
        >
          <v-card-text>
            <v-card-title class="text-center text-wrap mt-5 mb-2">
              Registration Successful
            </v-card-title>

            <div class="d-flex justify-center">
              <QRCodeVue3
                :cornersSquareOptions="qrOptions"
                :dotsOptions="qrOptions"
                :download="true"
                :height="250"
                :value="qrCode"
                :width="250"
                downloadButton="v-btn v-theme--light v-btn--block bg-primary v-btn--density-default v-btn--size-small v-btn--variant-flat mt-2"
              />
            </div>
            <div class="d-flex justify-center">
              <v-btn
                :width="250"
                class="mt-2"
                color="primary"
                size="small"
                variant="flat"
                @click="handleSendToWhatsapp"
                >Send to WhatsApp
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
        <div v-else class="text-center pa-10">Page expired!</div>
        <div class="d-flex justify-center">
          <v-btn
            :to="{
              name: 'club-single',
              params: { clubId: route.params.clubId },
            }"
            class="mt-2"
            size="small"
            variant="text"
            >Go Back
          </v-btn>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
