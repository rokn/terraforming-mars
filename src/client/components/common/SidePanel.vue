<template>
  <section v-show="open" class="tm-sheet" role="dialog" :aria-label="$t(title)">
    <div class="tm-sheet-head">
      <h2 class="tm-section-title tm-section-title--large" v-i18n>{{ title }}</h2>
      <slot name="tabs"></slot>
      <div v-if="zoomable" class="tm-zoom" role="group" :aria-label="$t('Card size')">
        <button type="button" class="tm-zoom-button" :disabled="zoom <= MIN_ZOOM" :title="$t('Zoom out')" data-test="zoom-out" @click="setZoom(zoom - ZOOM_STEP)">−</button>
        <span class="tm-zoom-button tm-zoom-level" data-test="zoom-level">{{ Math.round(zoom * 100) }}%</span>
        <button type="button" class="tm-zoom-button" :disabled="zoom >= MAX_ZOOM" :title="$t('Zoom in')" data-test="zoom-in" @click="setZoom(zoom + ZOOM_STEP)">+</button>
      </div>
      <button type="button" class="tm-sheet-close" :title="$t('Close')" :aria-label="$t('Close')" data-test="close" @click="$emit('close')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
      </button>
    </div>
    <div class="tm-sheet-body">
      <div class="tm-sheet-zoom" :style="zoomable ? {zoom: zoom} : undefined">
        <slot></slot>
      </div>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.5;

/**
 * A panel that shows secondary information (tableaus, the log, colonies) without the page having to scroll.
 * Escape closes it. When `zoomable`, its content can be shown smaller or larger.
 */
export default defineComponent({
  name: 'SidePanel',
  props: {
    open: {
      type: Boolean,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    zoomable: {
      type: Boolean,
      default: false,
    },
    initialZoom: {
      type: Number,
      default: 0.8,
    },
  },
  emits: ['close'],
  data() {
    return {
      zoom: this.initialZoom,
      ZOOM_STEP,
      MIN_ZOOM,
      MAX_ZOOM,
    };
  },
  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
  },
  methods: {
    onKeydown(event: KeyboardEvent): void {
      if (this.open && event.key === 'Escape') {
        this.$emit('close');
      }
    },
    setZoom(zoom: number): void {
      this.zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(zoom * 10) / 10));
    },
  },
});
</script>
