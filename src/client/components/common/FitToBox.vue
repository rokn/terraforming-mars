<template>
  <div class="fit-to-box-frame">
    <div class="fit-to-box" :class="{'fit-to-box--zoomed': zoom > 1}" ref="box" @wheel="onWheel">
      <div class="fit-to-box-sizer" :style="sizerStyle">
        <div class="fit-to-box-content" ref="content" :style="contentStyle">
          <slot></slot>
        </div>
      </div>
    </div>
    <div v-if="zoomable" class="tm-zoom fit-to-box-zoom" role="group" :aria-label="$t('Zoom')">
      <button type="button" class="tm-zoom-button" :disabled="zoom <= 1" :title="$t('Zoom out')" data-test="zoom-out" @click="setZoom(zoom - ZOOM_STEP)">−</button>
      <button type="button" class="tm-zoom-button tm-zoom-level" :title="$t('Fit')" data-test="zoom-fit" @click="setZoom(1)">{{ Math.round(zoom * 100) }}%</button>
      <button type="button" class="tm-zoom-button" :disabled="zoom >= MAX_ZOOM" :title="$t('Zoom in')" data-test="zoom-in" @click="setZoom(zoom + ZOOM_STEP)">+</button>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

const ZOOM_STEP = 0.25;
const MAX_ZOOM = 3;

type DataModel = {
  /** The scale at which the content exactly fits the box. */
  fitScale: number;
  /** How far the player zoomed in beyond fitting, where 1 means fitted. */
  zoom: number;
  width: number;
  height: number;
  boxWidth: number;
  observer: ResizeObserver | undefined;
  ZOOM_STEP: number;
  MAX_ZOOM: number;
};

/**
 * Scales its content to fit the box it is given, keeping the aspect ratio. When `zoomable`, the player
 * can zoom in further and scroll around the enlarged content (ctrl + wheel zooms too).
 *
 * The content is laid out at its natural size and transformed, so its own layout and click targets are unchanged.
 */
export default defineComponent({
  name: 'FitToBox',
  props: {
    /* The largest scale to apply when fitting, so content does not blow up on large screens. */
    maxScale: {
      type: Number,
      default: 1.3,
    },
    zoomable: {
      type: Boolean,
      default: false,
    },
  },
  data(): DataModel {
    return {
      fitScale: 1,
      zoom: 1,
      width: 0,
      height: 0,
      boxWidth: 0,
      observer: undefined,
      ZOOM_STEP,
      MAX_ZOOM,
    };
  },
  computed: {
    scale(): number {
      return Math.round(this.fitScale * this.zoom * 1000) / 1000;
    },
    offsetX(): number {
      return Math.max(0, Math.round((this.boxWidth - this.width * this.scale) / 2));
    },
    sizerStyle(): Record<string, string> {
      return {
        width: Math.ceil(this.width * this.scale + this.offsetX) + 'px',
        height: Math.ceil(this.height * this.scale) + 'px',
      };
    },
    contentStyle(): Record<string, string> {
      return {
        transform: `translate(${this.offsetX}px, 0) scale(${this.scale})`,
      };
    },
  },
  mounted() {
    this.fit();
    if (typeof ResizeObserver !== 'undefined') {
      this.observer = new ResizeObserver(() => this.fit());
      this.observer.observe(this.$refs.box as HTMLElement);
      this.observer.observe(this.$refs.content as HTMLElement);
    }
  },
  beforeUnmount() {
    this.observer?.disconnect();
  },
  methods: {
    fit(): void {
      const box = this.$refs.box as HTMLElement | undefined;
      const content = this.$refs.content as HTMLElement | undefined;
      if (box === undefined || content === undefined) {
        return;
      }
      // offsetWidth and offsetHeight ignore transforms, so they give the natural size.
      const width = content.offsetWidth;
      const height = content.offsetHeight;
      if (width === 0 || height === 0 || box.clientWidth === 0 || box.clientHeight === 0) {
        return;
      }
      this.width = width;
      this.height = height;
      this.boxWidth = box.clientWidth;
      this.fitScale = Math.min(this.maxScale, box.clientWidth / width, box.clientHeight / height);
    },
    /* Zooms to `zoom`, keeping the point at the centre of the box in place. */
    setZoom(zoom: number): void {
      const next = Math.min(MAX_ZOOM, Math.max(1, Math.round(zoom / ZOOM_STEP) * ZOOM_STEP));
      const box = this.$refs.box as HTMLElement | undefined;
      if (box === undefined || next === this.zoom) {
        this.zoom = next;
        return;
      }
      const ratio = next / this.zoom;
      const centreX = box.scrollLeft + box.clientWidth / 2;
      const centreY = box.scrollTop + box.clientHeight / 2;
      this.zoom = next;
      this.$nextTick(() => {
        box.scrollLeft = centreX * ratio - box.clientWidth / 2;
        box.scrollTop = centreY * ratio - box.clientHeight / 2;
      });
    },
    onWheel(event: WheelEvent): void {
      if (!this.zoomable || !(event.ctrlKey || event.metaKey)) {
        return;
      }
      event.preventDefault();
      this.setZoom(this.zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP));
    },
  },
});
</script>
