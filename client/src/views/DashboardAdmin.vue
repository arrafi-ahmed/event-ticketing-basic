<script setup>
import PageTitle from "@/components/PageTitle.vue";
import { computed, onMounted } from "vue";
import { useStore } from "vuex";
import { formatDate, getEventImageUrl } from "@/others/util";
import { useRoute, useRouter } from "vue-router";
import RemoveEntity from "@/components/RemoveEntity.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();

const events = computed(() => store.state.event.events);
const currentUser = computed(() => store.getters["user/getCurrentUser"]);

const deleteEvent = (eventId) => {
  store.dispatch("event/removeEvent", { eventId });
};

const fetchData = () => {
  store.dispatch("event/setEvents", currentUser.value.clubId);
};
onMounted(() => {
  fetchData();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title justify="space-between" sub-title="Admin" title="Dashboard">
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
            <v-list density="comfortable">
              <v-list-item
                :to="{ name: 'event-add' }"
                density="compact"
                title="Add Event"
              ></v-list-item>
              <v-list-item
                :to="{
                  name: 'club-edit',
                }"
                density="compact"
                title="Edit Club"
              ></v-list-item>
              <v-list-item
                :to="{
                  name: 'club-single',
                  params: {
                    clubId: currentUser.clubId,
                  },
                }"
                density="compact"
                title="View Club"
              ></v-list-item>
            </v-list>
          </v-menu>
        </page-title>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-list v-if="events.length > 0" lines="two">
          <template v-for="(item, index) in events">
            <v-list-item
              v-if="item"
              :key="index"
              :title="item?.name"
              @click="
                router.push({
                  name: 'event-attendees',
                  params: {
                    eventId: item.id,
                  },
                })
              "
            >
              <template v-slot:prepend="{}">
                <v-avatar
                  :image="getEventImageUrl(item.banner)"
                  :size="80"
                  rounded="sm"
                ></v-avatar>
              </template>
              <template v-slot:append="{}">
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
                  <v-list density="comfortable">
                    <v-list-item
                      title="Form"
                      @click="
                        router.push({
                          name: 'form-builder',
                          params: {
                            eventId: item.id,
                          },
                        })
                      "
                    ></v-list-item>
                    <v-list-item
                      title="Attendees"
                      @click="
                        router.push({
                          name: 'event-attendees',
                          params: {
                            eventId: item.id,
                          },
                        })
                      "
                    ></v-list-item>
                    <v-list-item
                      title="Scanner"
                      @click="
                        router.push({
                          name: 'event-scanner',
                          params: {
                            eventId: item.id,
                          },
                        })
                      "
                    ></v-list-item>
                    <v-list-item
                      title="Edit"
                      @click="
                        router.push({
                          name: 'event-edit',
                          params: {
                            eventId: item.id,
                          },
                        })
                      "
                    ></v-list-item>

                    <v-divider></v-divider>

                    <remove-entity
                      custom-class="text-error"
                      label="Delete"
                      variant="list"
                      @remove-entity="deleteEvent(item.id)"
                    ></remove-entity>
                  </v-list>
                </v-menu>
              </template>
              <template v-slot:subtitle="{}">
                <div>
                  {{
                    `Date: ${formatDate(item.startDate)} - ${formatDate(
                      item.endDate
                    )}`
                  }}
                  <br />
                  {{ `Location: ${item.location}` }}
                </div>
              </template>
            </v-list-item>
          </template>
        </v-list>
        <v-alert v-else border="start" closable density="compact"
          >No items found!
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-avatar {
  border-radius: 0;
}

.v-avatar.v-avatar--density-default {
  width: calc(var(--v-avatar-height) + 80px);
  height: calc(var(--v-avatar-height) + 20px);
}
</style>
