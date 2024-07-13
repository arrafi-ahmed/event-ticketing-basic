<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getCountryList, isValidEmail } from "@/others/util";
import { useStore } from "vuex";
import Logo from "@/components/Logo.vue";
import Phone from "@/components/Phone.vue";
import FormItems from "@/components/FormItems.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();

const club = computed(() => store.state.club.club);
const event = computed(() =>
  store.getters["event/getEventById"](route.params.eventId)
);
const registrationInit = {
  registrationData: {
    name: null,
    email: null,
    phone: null,
    others: [],
  },
  eventId: null,
  clubId: null,
};
const registration = reactive({ ...registrationInit });

const form = ref(null);
const isFormValid = ref(true);

const registerUser = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  registration.eventId = route.params.eventId;
  registration.clubId = route.params.clubId;

  registration.registrationData.others = additionalAnswers.value.map(
    (item, index) => ({
      qId: formQuestions.value?.[index]?.id,
      question: formQuestions.value?.[index]?.text,
      answer: item,
    })
  );

  await store.dispatch("registration/addRegistration", { registration });
  router.push({
    name: "event-register-success",
    params: { clubId: route.params.clubId, eventId: route.params.eventId },
  });
};
const handleUpdatePhone = ({ formattedPhone }) => {
  registration.registrationData.phone = formattedPhone;
};

const formQuestions = computed(() => store.state.registration.formQuestions);
const additionalAnswers = ref([]);
const handleUpdateAdditionalAnswers = ({ newVal }) => {
  additionalAnswers.value = newVal;
};

onMounted(async () => {
  if (!event.value?.id) {
    await store.dispatch(
      "event/setEventByEventIdnClubId",
      route.params.eventId
    );
  }
  await store.dispatch("form/setFormQuestions", {
    eventId: route.params.eventId,
  });
  if (!club.value?.id) {
    await store.dispatch("club/setClub", route.params.clubId);
  }
});
</script>
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="5" sm="6">
        <v-card
          class="mx-auto pa-5 my-2 rounded-xl bg-transparent"
          color=""
          elevation="0"
          max-width="500"
          variant="flat"
        >
          <v-card-text>
            <logo
              v-if="club.logo"
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
            <v-card-title v-if="event" class="text-center text-wrap mt-5">
              {{ event.name }}
            </v-card-title>
            <v-card-subtitle class="text-center mt-4 mb-8"
              >Registrati per inviare la tua richiesta
            </v-card-subtitle>
            <v-form
              ref="form"
              v-model="isFormValid"
              fast-fail
              @submit.prevent="registerUser"
            >
              <!-- Full Name -->
              <v-text-field
                v-model="registration.registrationData.name"
                :rules="[
                  (v) => !!v || 'required!',
                  (v) =>
                    (v && v.length <= 50) || 'Must not exceed 50 characters',
                ]"
                class="mt-2 mt-md-4 input-color-primary"
                clearable
                color="tertiary"
                density="default"
                hide-details="auto"
                label="Full Name"
                rounded="lg"
                variant="solo-filled"
              >
                <template v-slot:label>
                  <div>
                    <span>Nome e cognome</span>
                    <span class="text-error"> *</span>
                  </div>
                </template>
              </v-text-field>

              <v-text-field
                v-model="registration.registrationData.email"
                :rules="[
                  (v) => !!v || 'required!',
                  (v) => isValidEmail(v) || 'Invalid Email',
                ]"
                class="mt-2 mt-md-4 input-color-primary"
                clearable
                color="tertiary"
                density="default"
                hide-details="auto"
                rounded="lg"
                variant="solo-filled"
              >
                <template v-slot:label>
                  <div>
                    <span>Indirizzo e-mail</span>
                    <span class="text-error"> *</span>
                  </div>
                </template>
              </v-text-field>

              <phone
                :input-item="{
                  text: 'Telefono',
                  required: true,
                  options: getCountryList('all'),
                }"
                custom-class="mt-2 mt-md-4 input-color-primary"
                density="default"
                rounded="lg"
                variant="solo-filled"
                @update-phone="handleUpdatePhone"
              ></phone>

              <!--              add form questions-->
              <div
                v-if="
                  formQuestions && formQuestions.length > 0 && formQuestions[0]
                "
              >
                <form-items
                  :items="formQuestions"
                  type="question"
                  @update="handleUpdateAdditionalAnswers"
                />
              </div>

              <div class="pb-3 pl-1 mt-7 my-1">
                *Iscrivendoti accetti i Termini di servizio
              </div>

              <!-- Register Button -->
              <v-btn
                block
                color="primary"
                density="default"
                rounded="lg"
                size="x-large"
                @click="registerUser"
                >Registrati
              </v-btn>
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
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
