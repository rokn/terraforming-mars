<template>
  <span v-if="hasColonies || turmoil !== undefined" class="tm-xstats" data-test="expansion-stats">
    <template v-if="hasColonies">
      <span class="tm-xstat" :title="$t('Trade fleets free / total')" data-test="stat-fleets">
        <TradeFleetIcon :size="12" :used="freeFleets === 0" />
        {{ freeFleets }}/{{ player.fleetSize }}
      </span>
      <span class="tm-xstat" :title="$t('Colonies placed')" data-test="stat-colonies">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="8" /><path d="M4 12h16" /></svg>
        {{ player.coloniesCount }}
      </span>
    </template>
    <template v-if="turmoil !== undefined">
      <span class="tm-xstat" :title="$t('Influence')" data-test="stat-influence">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7z" /></svg>
        {{ player.influence }}
      </span>
      <span class="tm-xstat" :title="$t(inLobby ? 'Delegates in reserve, plus one in the lobby' : 'Delegates in reserve')" data-test="stat-delegates">
        <DelegateIcon :color="player.color" :size="12" />
        {{ reserve }}<span v-if="inLobby" class="tm-xstat-extra">+1</span>
      </span>
    </template>
  </span>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import TradeFleetIcon from '@/client/components/colonies/TradeFleetIcon.vue';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';

/**
 * A player's expansion counters as tiny icon and number chips: free / total trade fleets and colonies
 * placed in Colonies games, and influence and delegates in reserve (plus the lobby delegate, while unused)
 * in Turmoil games. Renders nothing when the game has none of these expansions.
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
    DelegateIcon,
  },
  computed: {
    hasColonies(): boolean {
      return this.game.colonies.length > 0;
    },
    freeFleets(): number {
      return Math.max(0, this.player.fleetSize - this.player.tradesThisGeneration);
    },
    turmoil(): TurmoilModel | undefined {
      return this.game.turmoil;
    },
    reserve(): number {
      return this.turmoil?.reserve.find((r) => r.color === this.player.color)?.number ?? 0;
    },
    inLobby(): boolean {
      return this.turmoil?.lobby.includes(this.player.color) ?? false;
    },
  },
});
</script>
