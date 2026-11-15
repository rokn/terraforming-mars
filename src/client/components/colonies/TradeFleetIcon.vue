<template>
  <svg class="tm-fleet-icon" :class="{'tm-fleet-icon--used': used}" :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" :data-color="color">
    <path d="M12 2c3.2 2.8 4.6 6.8 4.4 11.2L19 16.5V20l-4-1.6h-6L5 20v-3.5l2.6-3.3C7.4 8.8 8.8 4.8 12 2z" :fill="used ? 'none' : fill" :stroke="fill" stroke-width="1.6" stroke-linejoin="round" />
    <circle cx="12" cy="9.5" r="1.8" :fill="used ? fill : 'rgba(0, 0, 0, 0.45)'" />
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Color} from '@/common/Color';
import {playerHex} from '@/client/utils/gameTheme';

/** A trade fleet ship in a player's colour: filled when it is free, outlined once it is out trading. */
export default defineComponent({
  name: 'TradeFleetIcon',
  props: {
    color: {
      type: String as () => Color | undefined,
      default: undefined,
    },
    size: {
      type: Number,
      default: 16,
    },
    used: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    fill(): string {
      return this.color === undefined ? 'currentColor' : playerHex(this.color);
    },
  },
});
</script>
