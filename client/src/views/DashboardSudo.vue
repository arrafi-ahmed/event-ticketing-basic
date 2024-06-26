<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useStore } from "vuex";
import PageTitle from "@/components/PageTitle.vue";
import { useDisplay } from "vuetify";
import { getClubImageUrl } from "@/others/util";

const { mobile } = useDisplay();

const route = useRoute();
const router = useRouter();
const store = useStore();

const clubs = computed(() => store.state.club.clubs);

const panel = ref(["clubList"]);

const handleClickCredential = (club) => {
  store.commit("appUser/setClub", club);
  router.push({
    name: "credential-generate",
    params: {
      clubId: club.id,
    },
  });
};
const deleteClub = (clubId) => {
  store.dispatch("club/removeClub", { clubId });
};
const fetchData = () => {
  store.dispatch("club/setClubs");
};
onMounted(() => {
  fetchData();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title
          justify="space-between"
          sub-title="Event"
          title="Dashboard Sudo"
        >
          <v-row align="center">
            <v-divider class="mx-2" inset vertical></v-divider>

            <v-menu>
              <template v-slot:activator="{ props }">
                <v-btn
                  class="ml-5"
                  icon="mdi-dots-vertical"
                  v-bind="props"
                  variant="text"
                >
                </v-btn>
              </template>
              <v-list density="compact">
                <v-list-item
                  :to="{
                    name: 'club-add',
                  }"
                  density="compact"
                  title="Add Club"
                ></v-list-item>
              </v-list>
            </v-menu>
          </v-row>
        </page-title>
      </v-col>
    </v-row>

    <v-row justify="center">
      <v-col>
        <v-expansion-panels v-model="panel" multiple>
          <v-expansion-panel value="clubList">
            <v-expansion-panel-title>
              <v-icon size="x-large">mdi-list-box</v-icon>
              <span class="text-body-1 pl-2">All Clubs</span>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <v-list v-if="clubs.length > 0" density="default" lines="two">
                <template v-for="(item, index) in clubs">
                  <v-list-item
                    v-if="item"
                    :key="index"
                    :title="item?.name"
                    @click="
                      router.push({
                        name: 'club-single',
                        params: {
                          clubId: item.id,
                        },
                      })
                    "
                  >
                    <template v-slot:prepend>
                      <v-avatar
                        :image="getClubImageUrl(item.logo)"
                        :size="80"
                        rounded="sm"
                      ></v-avatar>
                    </template>

                    <template v-slot:append>
                      <v-menu>
                        <template v-slot:activator="{ props }">
                          <v-btn
                            class="ml-5"
                            icon="mdi-dots-vertical"
                            v-bind="props"
                            variant="text"
                          >
                          </v-btn>
                        </template>
                        <v-list density="compact">
                          <v-list-item
                            density="compact"
                            title="View Club"
                            @click="
                              router.push({
                                name: 'club-single',
                                params: {
                                  clubId: item.id,
                                },
                              })
                            "
                          ></v-list-item>

                          <v-list-item
                            density="compact"
                            title="Generate Credentials"
                            @click="handleClickCredential(item)"
                          ></v-list-item>

                          <v-list-item
                            class="text-error"
                            title="Delete"
                            @click="deleteClub(item.id)"
                          ></v-list-item>
                        </v-list>
                      </v-menu>
                    </template>

                    <template v-slot:subtitle>
                      <div class="text-truncate">
                        {{ item?.description }}
                      </div>
                    </template>
                  </v-list-item>
                  <v-divider v-if="index !== clubs.length - 1"></v-divider>
                </template>
              </v-list>
              <v-alert v-else border="start" closable density="compact"
                >No clubs found!
              </v-alert>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped></style>
