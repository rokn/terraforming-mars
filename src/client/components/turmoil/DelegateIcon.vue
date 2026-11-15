<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" class="tm-delegate-icon" :data-color="color">
    <circle cx="12" cy="7" r="5" :fill="fill" stroke="#140C09" stroke-width="1.2" />
    <path d="M3 23c0-6 4-10 9-10s9 4 9 10z" :fill="fill" stroke="#140C09" stroke-width="1.2" />
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import {playerHex} from '@/client/utils/gameTheme';

/** A delegate figure in a player's colour, or grey for neutral delegates. */
export default defineComponent({
  name: 'DelegateIcon',
  props: {
    color: {
      type: String as () => Color,
      required: true,
    },
    size: {
      type: Number,
      default: 18,
    },
  },
  computed: {
    fill(): string {
      return playerHex(this.color);
    },
  },
});
</script>
