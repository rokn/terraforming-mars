<template>
  <span class="tm-party-chip" :style="{'--tm-party': colors.fill, '--tm-party-ink': colors.ink}" :data-party="party" v-i18n>{{ party }}</span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {PartyColors, partyColors} from '@/client/utils/turmoil';

/** A party's name on a band of its colour. */
export default defineComponent({
  name: 'PartyChip',
  props: {
    party: {
      type: String as () => PartyName,
      required: true,
    },
  },
  computed: {
    colors(): PartyColors {
      return partyColors(this.party);
    },
  },
});
</script>
