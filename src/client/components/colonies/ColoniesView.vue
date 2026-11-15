<template>
  <div class="tm-colonies-view" :class="{'tm-colonies-view--picking': picking}">
    <div v-if="fleets" class="tm-fleets" data-test="fleets">
      <span class="tm-fleets-title" v-i18n>Trade fleets</span>
      <span v-for="player in players" :key="player.color" class="tm-fleet" :class="{'tm-fleet--none': freeFleets(player) === 0}" data-test="fleet">
        <PlayerCube :color="player.color" :size="14" />
        <span class="tm-fleet-name">{{ player.name }}</span>
        <span class="tm-fleet-ships">
          <TradeFleetIcon v-for="idx in player.fleetSize" :key="idx" :color="player.color" :size="15" :used="idx > freeFleets(player)" />
        </span>
        <span class="tm-fleet-count" data-test="fleet-count">{{ freeFleets(player) }}/{{ player.fleetSize }}</span>
      </span>
      <span v-if="picking" class="tm-fleets-pick" data-test="colonies-pick" v-i18n>Click a highlighted tile to choose it</span>
    </div>
    <FitToBox class="tm-colonies-fit" zoomable :maxScale="1.1">
      <div class="tm-colonies-grid" :style="{'grid-template-columns': 'repeat(' + columnCount + ', auto)'}">
        <ColonyTile v-for="colony in colonies" :key="colony.name"
          :colony="colony"
          :players="players"
          :selectable="selectable.includes(colony.name)"
          :selected="selected === colony.name"
          :dimmed="picking && !selectable.includes(colony.name)"
          :fadeMarker="fadeMarker && selectable.includes(colony.name)"
          @select="$emit('select', $event)" />
      </div>
    </FitToBox>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import FitToBox from '@/client/components/common/FitToBox.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import ColonyTile from '@/client/components/colonies/ColonyTile.vue';
import TradeFleetIcon from '@/client/components/colonies/TradeFleetIcon.vue';
import {ColonyModel} from '@/common/models/ColonyModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {PublicPlayerModel} from '@/common/models/PlayerModel';

/**
 * The Colonies centre view: every colony tile in play, fitted to the panel, under a line with each
 * player's free and total trade fleets.
 *
 * Tiles named in `selectable` can be clicked, which emits `select` with the colony's name.
 */
export default defineComponent({
  name: 'ColoniesView',
  props: {
    colonies: {
      type: Array as () => ReadonlyArray<ColonyModel>,
      required: true,
    },
    players: {
      type: Array as () => ReadonlyArray<PublicPlayerModel>,
      required: true,
    },
    /* Tiles per row. By default, three rows at most fit wide panels best. */
    columns: {
      type: Number,
      default: undefined,
    },
    selectable: {
      type: Array as () => ReadonlyArray<ColonyName>,
      default: () => [],
    },
    selected: {
      type: String as () => ColonyName | undefined,
      default: undefined,
    },
    /* False to leave out the trade fleets line, as during setup. */
    fleets: {
      type: Boolean,
      default: true,
    },
    /* True when the choice is where to build: the track markers fade to show the build bonuses. */
    fadeMarker: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select'],
  components: {
    FitToBox,
    PlayerCube,
    ColonyTile,
    TradeFleetIcon,
  },
  computed: {
    columnCount(): number {
      const count = this.colonies.length;
      return this.columns ?? Math.min(4, Math.max(Math.min(count, 2), Math.ceil(count / 2)));
    },
    picking(): boolean {
      return this.selectable.length > 0;
    },
  },
  methods: {
    freeFleets(player: PublicPlayerModel): number {
      return Math.max(0, player.fleetSize - player.tradesThisGeneration);
    },
  },
});
</script>
