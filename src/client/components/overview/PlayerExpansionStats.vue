<template>
  <span v-if="hasColonies" class="tm-xstats" data-test="expansion-stats">
    <span class="tm-xstat" :title="$t('Trade fleets free / total')" data-test="stat-fleets">
      <TradeFleetIcon :size="12" :used="freeFleets === 0" />
      {{ freeFleets }}/{{ player.fleetSize }}
    </span>
    <span class="tm-xstat" :title="$t('Colonies placed')" data-test="stat-colonies">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /></svg>
      {{ player.coloniesCount }}
    </span>
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import TradeFleetIcon from '@/client/components/colonies/TradeFleetIcon.vue';

/**
 * A player's expansion counters as tiny icon and number chips: free / total trade fleets and colonies
 * placed, in Colonies games. Renders nothing when the game has none of these expansions.
 */
export default defineComponent({
  name: 'PlayerExpansionStats',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    game: {
      type: Object as () => GameModel,
      required: true,
    },
  },
  components: {
    TradeFleetIcon,
  },
  computed: {
    hasColonies(): boolean {
      return this.game.colonies.length > 0;
    },
    freeFleets(): number {
      return Math.max(0, this.player.fleetSize - this.player.tradesThisGeneration);
    },
  },
});
</script>
