<script setup>
import { useDisplay } from "vuetify";
import { ref } from "vue";

const { xs } = useDisplay();
const dialog = ref(false);
const {
  id,
  message,
  label,
  variant,
  btnVariant,
  customClass,
  size,
  color,
  prependIcon,
} = defineProps({
  id: {},
  message: { default: "Are you sure?" },
  label: {},
  btnVariant: { default: "flat" },
  customClass: {},
  size: {},
  prependIcon: { default: undefined },
  color: { default: "error" },
  variant: { default: "btn" },
});
const emit = defineEmits(["removeEntity"]);

const remove = (id) => {
  if (id) {
    emit("removeEntity", id);
  } else {
    emit("removeEntity");
  }
  dialog.value = false;
};
</script>
<template>
  <template v-if="variant === 'btn'">
    <v-btn
      v-if="xs && label"
      :class="customClass"
      :color="color"
      :size="size || 'small'"
      :variant="btnVariant"
      density="comfortable"
      @click.stop="dialog = !dialog"
    >
      {{ label }}
    </v-btn>
    <v-btn
      v-if="xs && !label"
      :class="customClass"
      :color="color"
      :size="size || 'small'"
      :variant="btnVariant"
      density="compact"
      icon="mdi-close"
      @click.stop="dialog = !dialog"
    >
    </v-btn>
    <v-btn
      v-if="!xs"
      :class="customClass"
      :color="color"
      :size="size || 'default'"
      :variant="btnVariant"
      density="default"
      @click.stop="dialog = !dialog"
      >{{ label || "Remove" }}
    </v-btn>
  </template>
  <template v-else-if="variant === 'list'">
    <v-list-item
      :class="customClass"
      :color="color"
      :density="xs ? 'compact' : 'comfortable'"
      :prepend-icon="prependIcon"
      :size="size || 'small'"
      @click.stop="dialog = !dialog"
    >
      {{ label }}
    </v-list-item>
  </template>

  <v-dialog v-model="dialog" width="400">
    <v-card>
      <v-card-title>
        <span>{{ label || "Remove" }}</span>
      </v-card-title>
      <v-card-text>{{ message }}</v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn
          :color="color"
          :density="xs ? 'comfortable' : 'default'"
          @click="remove(id)"
          >Yes
        </v-btn>
        <v-btn
          :color="color"
          :density="xs ? 'comfortable' : 'default'"
          @click="dialog = !dialog"
          >No
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped></style>
