<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getApiPublicImgUrl, isValidEmail, stripePublic } from "@/others/util";
import { useStore } from "vuex";
import Logo from "@/components/Logo.vue";
import Phone from "@/components/Phone.vue";
import FormItems from "@/components/FormItems.vue";
import { useDisplay } from "vuetify";
import { loadStripe } from "@stripe/stripe-js/pure";

const store = useStore();
const route = useRoute();
const router = useRouter();
const { xs, sm } = useDisplay();

const registration = computed(() => store.state.registration.registration);
const club = computed(() => store.state.club.club);
const event = computed(() => store.state.event.event);
const extras = computed(() => store.state.event.extras);

const selectedExtrasId = ref([]);
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
const newRegistration = reactive({ ...registrationInit });

const form = ref(null);
const isFormValid = ref(true);

const registerUser = async () => {
  await form.value.validate();
  if (!isFormValid.value) return;

  newRegistration.eventId = route.params.eventId;
  newRegistration.clubId = route.params.clubId;

  newRegistration.registrationData.others = additionalAnswers.value.map(
    (item, index) => ({
      qId: formQuestions.value?.[index]?.id,
      question: formQuestions.value?.[index]?.text,
      answer: item,
    }),
  );

  const payload = {
    newRegistration,
    extrasIds: selectedExtrasId.value,
  };
  const { savedRegistration, clientSecret } = await store.dispatch(
    "registration/initRegistration",
    payload,
  );

  if (clientSecret === "no-stripe") {
    return router.push({
      name: "event-register-success",
      params: {
        clubId: savedRegistration.clubId,
        eventId: savedRegistration.eventId,
      },
      query: {
        registration_id: savedRegistration.id,
        uuid: savedRegistration.uuid,
      },
    });
  }

  showCheckout.value = true;
  await nextTick();

  if (!checkout.value) {
    checkout.value = await stripe.initEmbeddedCheckout({
      clientSecret,
    });
    // Mount Checkout
    checkout.value.mount("#checkout");
  } else {
    console.warn("Checkout already mounted. Ignoring.");
  }
};

let checkout = ref(null);
const handleUpdatePhone = ({ formattedPhone }) => {
  newRegistration.registrationData.phone = formattedPhone;
};

const formQuestions = computed(() => store.state.form.formQuestions);
const additionalAnswers = ref([]);
const handleUpdateAdditionalAnswers = ({ newVal }) => {
  additionalAnswers.value = newVal;
};

let stripe = null;
const showCheckout = ref(false);
const isEventFree = computed(() => event.value?.ticketPrice == 0);

const mustLoadStripePublic = computed(() => stripePublic);

const handleExtrasSelected = ({ extrasId }) => {
  const foundIndex = selectedExtrasId.value.findIndex(
    (item) => item === extrasId,
  );
  if (foundIndex === -1) {
    selectedExtrasId.value.push(extrasId);
  } else {
    selectedExtrasId.value.splice(foundIndex, 1);
  }
};

onMounted(async () => {
  await Promise.allSettled([
    store.dispatch("club/setClub", route.params.clubId),
    store.dispatch("event/setEvent", {
      eventId: route.params.eventId,
    }),
    store.dispatch("form/setFormQuestions", {
      eventId: route.params.eventId,
    }),
    store.dispatch("event/setExtras", route.params.eventId),
  ]);
  if (!isEventFree.value || extras.value.length) {
    stripe = await loadStripe(mustLoadStripePublic.value);
  }
});

onUnmounted(() => {
  if (checkout.value) {
    checkout.value.destroy();
  }
  // checkout = null;
});
</script>
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" md="5" sm="6">
        <v-card
          class="mx-auto pa-0 pa-md-5 my-0 my-md-2 rounded-xl bg-transparent"
          color=""
          elevation="0"
          max-width="500"
          variant="flat"
        >
          <v-card-text>
            <logo
              v-if="club.logo"
              :img-src="getApiPublicImgUrl(club.logo, 'club-logo')"
              :max-width="sm ? 200 : 300"
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
            <v-card-title
              v-if="event"
              class="text-center text-wrap mt-2 mt-md-5"
            >
              {{ event.name }}
            </v-card-title>
            <v-card-subtitle class="text-center mb-4 mb-md-8"
              >Registrati per inviare la tua richiesta
            </v-card-subtitle>
            <v-form
              v-if="!showCheckout"
              ref="form"
              v-model="isFormValid"
              fast-fail
              @submit.prevent="registerUser"
            >
              <!-- Full Name -->
              <v-text-field
                v-model="newRegistration.registrationData.name"
                :density="xs ? 'comfortable' : 'default'"
                :rules="[
                  (v) => !!v || 'required!',
                  (v) =>
                    (v && v.length <= 50) || 'Must not exceed 50 characters',
                ]"
                class="mt-2 mt-md-4 input-color-primary"
                clearable
                color="tertiary"
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
                v-model="newRegistration.registrationData.email"
                :density="xs ? 'comfortable' : 'default'"
                :rules="[
                  (v) => !!v || 'required!',
                  (v) => isValidEmail(v) || 'Invalid Email',
                ]"
                class="mt-2 mt-md-4 input-color-primary"
                clearable
                color="tertiary"
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
                :density="xs ? 'comfortable' : 'default'"
                :input-item="{
                  text: 'Telefono',
                  required: true,
                  options: getCountryList('all'),
                }"
                custom-class="mt-2 mt-md-4 input-color-primary"
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

              <div class="pb-1 pb-md-3 pl-1 mt-3 mt-md-7 my-1">
                *Registrandoti accetti i
                <router-link
                  :to="{ name: 'page-info', params: { type: 'terms' } }"
                  >Termini e condizioni
                </router-link>
                ,
                <router-link
                  :to="{
                    name: 'page-info',
                    params: { type: 'privacy-policy' },
                  }"
                  >l'Informativa sulla privacy
                </router-link>
                &
                <router-link
                  :to="{ name: 'page-info', params: { type: 'cookie-policy' } }"
                  >l'Informativa sui cookie
                </router-link>
              </div>

              <!-- Register Button -->
              <v-btn
                :density="xs ? 'comfortable' : 'default'"
                block
                color="primary"
                rounded="lg"
                size="x-large"
                @click="registerUser"
                >{{ isEventFree ? "Registrati" : "Procedere" }}
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
            <div v-else id="checkout"></div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col v-if="extras.length && !showCheckout" cols="12" md="4" sm="5">
        <v-card
          color="tertiary"
          subtitle="Acquista i tuoi voucher per questo evento"
          title="Voucher Disponibili"
        >
          <v-card-text>
            <v-card
              v-for="(extra, index) in extras"
              :class="{ 'mt-2 mt-md-4': index > 0 }"
              color="primary"
              link
              @click="handleExtrasSelected({ extrasId: extra.id })"
            >
              <v-badge
                v-if="selectedExtrasId.includes(extra.id)"
                class="ml-4"
                color="success"
                content="+ Added"
                location="end"
              >
              </v-badge>
              <v-card-title>
                <div class="d-flex justify-space-between align-center">
                  <div>{{ extra.name }}</div>
                  <v-chip density="compact"> € {{ extra.price }}</v-chip>
                </div>
              </v-card-title>
              <v-card-subtitle>
                {{ extra.description }}
              </v-card-subtitle>
            </v-card>
            <v-alert
              class="mt-2 mt-md-4"
              color="primary"
              density="compact"
              text="I voucher acquistati ti saranno inviati via email. Potrai mostrarli all'ingresso dell'evento per accedere."
              title="Voucher"
              type="info"
              variant="tonal"
            ></v-alert>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
