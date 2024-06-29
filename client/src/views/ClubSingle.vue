<script setup>
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getEventImageUrl } from "@/others/util";
import { useStore } from "vuex";
import Logo from "@/components/Logo.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();
const club = computed(() => store.state.club.club);
const events = computed(() => store.state.event.events);

const fetchData = async () => {
  await Promise.all([
    store.dispatch("event/setActiveEvents", route.params.clubId),
    store.dispatch("club/setClub", route.params.clubId),
  ]);
};
onMounted(() => {
  fetchData();
});
</script>
<template>
  <v-container class="fill-height">
    <v-row align="center" justify="center">
      <v-col cols="12" sm="10">
        <v-card
          class="mx-auto pa-5 my-2 rounded-xl bg-transparent"
          elevation="0"
          max-width="375"
          variant="flat"
        >
          <v-card-text>
            <logo
              :img-src-api="{ name: club.logo, type: 'club-logo' }"
              :max-height="300"
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
            <v-card-title class="text-center text-wrap mt-5">
              Upcoming events
            </v-card-title>
            <v-card-subtitle class="text-center mb-8"
              >Select and book your entry
            </v-card-subtitle>

            <!--            event list-->
            <!--              TODO: fix height:600-->
            <v-carousel
              v-if="events?.length > 0"
              :show-arrows="true"
              continuous
              cycle
              hide-delimiters
            >
              <!--                            height="600" -->
              <v-carousel-item
                v-for="(item, index) in events"
                :key="index"
                height="100%"
              >
                <v-sheet
                  :aspect-ratio="0.5"
                  class="bg-transparent fill-height v-icon--clickable rounded-lg"
                  height="100%"
                  @click="
                    () =>
                      router.push({
                        name: 'event-register',
                        params: { clubId: item.clubId, eventId: item.id },
                      })
                  "
                >
                  <v-img
                    :aspect-ratio="0.563"
                    :cover="true"
                    :src="getEventImageUrl(item.banner)"
                    class="rounded-t-lg"
                  ></v-img>

                  <div class="bg-primary text-center rounded-b-lg pa-3">
                    <div class="font-weight-bold">{{ item.name }}</div>
                    <h5 class="font-weight-light text-truncate">
                      {{ item.description }}
                    </h5>
                  </div>
                </v-sheet>
              </v-carousel-item>

              <template v-slot:prev="{ props }">
                <v-icon
                  class="bg-grey-lighten-4 opacity-60 rounded-circle"
                  icon="mdi-chevron-left"
                  @click="props.onClick"
                ></v-icon>
              </template>
              <template v-slot:next="{ props }">
                <v-icon
                  class="bg-grey-lighten-4 opacity-60 rounded-circle"
                  icon="mdi-chevron-right"
                  @click="props.onClick"
                ></v-icon>
              </template>
            </v-carousel>
            <div v-else>
              <div class="text-center">No events available!</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style></style>
