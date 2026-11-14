<template>
  <svg :width="size" :height="Math.round(size * 28 / 26)" viewBox="0 0 26 28" aria-hidden="true" class="player-cube" :data-color="color">
    <polygon points="13,1 25,7.5 13,14 1,7.5" :fill="shades.top" />
    <polygon points="1,7.5 13,14 13,27 1,20.5" :fill="shades.left" />
    <polygon points="25,7.5 13,14 13,27 25,20.5" :fill="shades.right" />
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import {CubeShades, cubeShades} from '@/client/utils/gameTheme';

export default defineComponent({
  name: 'PlayerCube',
  props: {
    color: {
      type: String as () => Color,
      required: true,
    },
    size: {
      type: Number,
      default: 26,
    },
  },
  computed: {
    shades(): CubeShades {
      return cubeShades(this.color);
    },
  },
});
</script>
