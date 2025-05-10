<script setup>
import PageTitle from "@/components/PageTitle.vue";
import { computed, onMounted, reactive, ref } from "vue";
import Extras from "@/models/Extras";
import { useStore } from "vuex";
import ExtrasItem from "@/models/ExtrasItem";
import { useRoute, useRouter } from "vue-router";
import ConfirmationDialog from "@/components/ConfirmationDialog.vue";

const store = useStore();
const route = useRoute();
const router = useRouter();

const currentUser = computed(() => store.state.user.currentUser);
const targetClubId = computed(() =>
  currentUser.value.role === "sudo"
    ? route.params.clubId
    : currentUser.value.role === "admin"
      ? currentUser.value.clubId
      : null,
);
const club = computed(() => store.state.club.club);
const extras = computed(() => store.state.event.extras);

const newExtras = reactive({ ...new Extras() });

const openAddVoucherDialog = () => {
  addExtrasDialog.value = !addExtrasDialog.value;
};
const addExtrasDialog = ref(false);
const addExtrasForm = ref(null);
const isAddExtrasFormValid = ref(true);

const openEditVoucherDialog = ({ id }) => {
  editExtrasDialog.value = !editExtrasDialog.value;
  const targetExtra = extras;
  Object.assign(newExtras, { ...extras.value });
};
const editExtrasDialog = ref(false);
const editExtrasForm = ref(null);
const isEditExtrasFormValid = ref(true);

const addMoreVoucherItems = () => {
  newExtras.content = newExtras.content.concat({
    ...new ExtrasItem(),
  });
};
const handleExtrasAdd = async () => {
  await addExtrasForm.value.validate();
  if (!isAddExtrasFormValid.value) return;

  newExtras.eventId = route.params.eventId;

  store.dispatch("event/saveExtras", { newExtras }).then((result) => {
    // newEvent = {...newEvent, ...newEventInit}
    Object.assign(newExtras, {
      ...new Extras(),
    });
    addExtrasDialog.value = !addExtrasDialog.value;
  });
};
const fetchData = async () => {
  await Promise.allSettled([
    store.dispatch("club/setClub", targetClubId.value),
    store.dispatch("event/setExtras", route.params.eventId),
  ]);
};
onMounted(async () => {
  await fetchData();
});
</script>

<template>
  <v-container>
    <v-row>
      <v-col>
        <page-title
          justify="space-between"
          :sub-title="club.name"
          title="Vouchers"
        >
          <div class="d-flex align-center">
            <v-btn
              prepend-icon="mdi-plus"
              color="primary"
              rounded="lg"
              class="mr-2"
              @click="openAddVoucherDialog"
            >
              Create
            </v-btn>
            <v-btn
              icon="mdi-arrow-left"
              variant="text"
              @click="$router.back()"
            ></v-btn>
          </div>

          <!--          <v-menu>-->
          <!--            <template v-slot:activator="{ props }">-->
          <!--              <v-btn icon="mdi-dots-vertical" v-bind="props" variant="text">-->
          <!--              </v-btn>-->
          <!--            </template>-->
          <!--            <v-list density="comfortable">-->
          <!--              <v-list-item-->
          <!--                link-->
          <!--                density="compact"-->
          <!--                prepend-icon="mdi-plus"-->
          <!--                title="Create"-->
          <!--                @click="openAddVoucherDialog"-->
          <!--              ></v-list-item>-->
          <!--            </v-list>-->
          <!--          </v-menu>-->
        </page-title>
      </v-col>
    </v-row>

    <v-row align="stretch">
      <v-col cols="12" sm="6" md="4" lg="3" v-for="(extra, index) in extras">
        <v-card rounded="lg" class="fill-height">
          <v-card-title>
            <div class="d-flex justify-space-between align-center">
              <div>{{ extra.name }}</div>
              <v-chip density="compact"> € {{ extra.price }}</v-chip>
            </div>
          </v-card-title>
          <v-card-subtitle>
            {{ extra.description }}
          </v-card-subtitle>
          <v-card-text>
            <div>Contents:</div>
            <v-list density="compact">
              <v-list-item v-for="(content, contentIndex) in extra.content">
                <template #prepend>
                  <v-chip density="comfortable" size="small"
                    >{{ content.quantity }} x
                  </v-chip>
                </template>
                <template #title> &nbsp;{{ content.name }}</template>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions class="justify-space-between">
            <v-btn
              prepend-icon="mdi-square-edit-outline"
              variant="outlined"
              rounded="lg"
              class="border-grey"
              @click="openEditVoucherDialog({ id: extra.id })"
              >Edit
            </v-btn>
            <confirmation-dialog>
              <template #activator="{ onClick }">
                <v-btn
                  prepend-icon="mdi-close"
                  variant="flat"
                  color="error"
                  rounded="lg"
                  >Delete
                </v-btn>
              </template>
            </confirmation-dialog>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <v-dialog v-model="addExtrasDialog" :width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between">
        <h2>Add Voucher</h2>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="addExtrasDialog = !addExtrasDialog"
        />
      </v-card-title>
      <v-card-text>
        <v-form
          ref="addExtrasForm"
          v-model="isAddExtrasFormValid"
          fast-fail
          @submit.prevent="handleExtrasAdd"
        >
          <v-text-field
            v-model="newExtras.name"
            :rules="[(v) => !!v || 'Name is required!']"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Name"
          />
          <v-textarea
            v-model="newExtras.description"
            :rules="[(v) => !!v || 'Description is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Description"
          />
          <v-text-field
            v-model="newExtras.price"
            :rules="[(v) => !!v || 'Price is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Price"
            type="number"
          />
          <v-row
            v-for="(item, index) in newExtras.content"
            :key="index"
            no-gutters
          >
            <v-col cols="9">
              <v-text-field
                v-model="item.name"
                :label="`Item #${index + 1}`"
                :rules="[(v) => !!v || 'Item is required!']"
                class="mt-2 mt-md-4"
                clearable
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                v-model="item.quantity"
                :label="`Quantity`"
                :rules="[(v) => !!v || 'Quantity is required!']"
                class="mt-2 mt-md-4 ml-2"
                density="comfortable"
                hide-details="auto"
                type="number"
                min="0"
              />
            </v-col>
          </v-row>
          <v-btn
            class="mt-2"
            color="primary"
            size="small"
            @click="addMoreVoucherItems"
          >
            Add More Item
          </v-btn>

          <v-card-actions class="mt-2 mt-md-4">
            <v-spacer />
            <v-btn color="primary" type="submit" variant="flat"> Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>

  <v-dialog v-model="editExtrasDialog" :width="500">
    <v-card>
      <v-card-title class="d-flex justify-space-between">
        <h2>Edit Voucher</h2>
        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          @click="editExtrasDialog = !editExtrasDialog"
        />
      </v-card-title>
      <v-card-text>
        <v-form
          ref="editExtrasForm"
          v-model="isEditExtrasFormValid"
          fast-fail
          @submit.prevent="handleExtrasAdd"
        >
          <v-text-field
            v-model="newExtras.name"
            :rules="[(v) => !!v || 'Name is required!']"
            class="mt-2"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Name"
          />
          <v-textarea
            v-model="newExtras.description"
            :rules="[(v) => !!v || 'Description is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Description"
          />
          <v-text-field
            v-model="newExtras.price"
            :rules="[(v) => !!v || 'Price is required!']"
            class="mt-2 mt-md-4"
            clearable
            density="comfortable"
            hide-details="auto"
            label="Price"
            type="number"
          />
          <v-row
            v-for="(item, index) in newExtras.content"
            :key="index"
            no-gutters
          >
            <v-col cols="9">
              <v-text-field
                v-model="item.name"
                :label="`Item #${index + 1}`"
                :rules="[(v) => !!v || 'Item is required!']"
                class="mt-2 mt-md-4"
                clearable
                density="comfortable"
                hide-details="auto"
              />
            </v-col>
            <v-col cols="3">
              <v-text-field
                v-model="item.quantity"
                :label="`Quantity`"
                :rules="[(v) => !!v || 'Quantity is required!']"
                class="mt-2 mt-md-4 ml-2"
                density="comfortable"
                hide-details="auto"
                type="number"
                min="0"
              />
            </v-col>
          </v-row>
          <v-btn
            class="mt-2"
            color="primary"
            size="small"
            @click="addMoreVoucherItems"
          >
            Add More Item
          </v-btn>

          <v-card-actions class="mt-2 mt-md-4">
            <v-spacer />
            <v-btn color="primary" type="submit" variant="flat"> Save</v-btn>
          </v-card-actions>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<style scoped>
.border-grey {
  border-color: #00000020;
}
</style>
