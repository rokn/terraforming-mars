<template>
  <div v-if="views.length > 1" class="tm-view-tabs" role="tablist" :aria-label="$t('Views')">
    <button v-for="view in views" :key="view" type="button" role="tab"
      class="tm-view-tab" :class="{'tm-view-tab--on': view === modelValue}"
      :aria-selected="view === modelValue"
      :aria-keyshortcuts="keyOf(view)"
      :data-test="'view-tab-' + view"
      @click="$emit('update:modelValue', view)">
      <span v-i18n>{{ specs[view].label }}</span>
      <kbd class="tm-kbd" :title="$t('Shortcut')">{{ keyOf(view) }}</kbd>
    </button>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {CENTER_VIEW_SPECS, CenterView} from '@/client/utils/centerView';

/** The segmented control that switches the centre stage between Mars and the expansion views. Hidden with one view. */
export default defineComponent({
  name: 'CenterViewTabs',
  props: {
    views: {
      type: Array as () => ReadonlyArray<CenterView>,
      required: true,
    },
    modelValue: {
      type: String as () => CenterView,
      required: true,
    },
  },
  emits: ['update:modelValue'],
  computed: {
    specs(): typeof CENTER_VIEW_SPECS {
      return CENTER_VIEW_SPECS;
    },
  },
  methods: {
    /* The letter of the key that shows `view`. */
    keyOf(view: CenterView): string {
      return CENTER_VIEW_SPECS[view].key.replace('Key', '');
    },
  },
});
</script>
