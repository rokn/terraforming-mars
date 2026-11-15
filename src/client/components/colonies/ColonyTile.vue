<template>
  <div class="tm-colony-tile"
    :class="{
      'tm-colony-tile--inactive': !colony.isActive,
      'tm-colony-tile--selectable': selectable,
      'tm-colony-tile--selected': selected,
      'tm-colony-tile--dimmed': dimmed,
    }"
    :role="selectable ? 'button' : undefined"
    :tabindex="selectable ? 0 : undefined"
    :aria-pressed="selectable ? selected : undefined"
    :aria-label="colony.name"
    :data-test="'colony-tile-' + colony.name"
    @click="select"
    @keydown.enter.prevent="select"
    @keydown.space.prevent="select">
    <div class="tm-colony-tile-card">
      <Colony :colony="colony" :active="colony.isActive" :fadeMarker="fadeMarker" />
      <div v-if="!colony.isActive" class="tm-colony-tile-inactive" data-test="colony-inactive">
        <span class="tm-colony-tile-inactive-label" v-i18n>Inactive</span>
        <span class="tm-colony-tile-inactive-hint">{{ inactiveHint }}</span>
      </div>
      <span v-if="selected" class="tm-colony-tile-check" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M4 12l5 5L20 6" /></svg>
      </span>
    </div>
    <div class="tm-colony-tile-strip">
      <span class="tm-colony-tile-stat" data-test="colony-owners">
        <span class="tm-colony-tile-key" v-i18n>Colonies</span>
        <span class="tm-colony-tile-value">{{ colony.colonies.length }}/{{ maxColonies }}</span>
        <PlayerCube v-for="(color, idx) in colony.colonies" :key="idx" :color="color" :size="22" />
      </span>
      <span v-if="tradeNow !== undefined" class="tm-colony-tile-stat" data-test="colony-trade-now">
        <span class="tm-colony-tile-key" v-i18n>Trade now</span>
        <span class="tm-colony-tile-value">{{ tradeNow }}</span>
      </span>
      <span v-if="colony.visitor !== undefined" class="tm-colony-tile-stat tm-colony-tile-docked" :title="$t('Trade fleet docked here')" data-test="colony-visitor">
        <TradeFleetIcon :color="colony.visitor" :size="26" />
        <span>{{ playerName(colony.visitor) }}</span>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import Colony from '@/client/components/colonies/Colony.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import TradeFleetIcon from '@/client/components/colonies/TradeFleetIcon.vue';
import {ColonyModel} from '@/common/models/ColonyModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyMetadata} from '@/common/colonies/ColonyMetadata';
import {getColonyOrThrow} from '@/client/colonies/ClientColonyManifest';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {MAX_COLONIES_PER_TILE} from '@/common/constants';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

// Tiles whose trade row shows icons rather than amounts.
const ICON_TRADE_ROWS: ReadonlyArray<ColonyName> = [ColonyName.MERCURY, ColonyName.HYGIEA, ColonyName.EUROPA, ColonyName.TERRA];

/**
 * A colony tile framed for the game screen: the tile itself, a strip that spells out its colonies, current
 * trade income and docked fleet, and an "Inactive" label over tiles that are not in play yet.
 *
 * When `selectable`, clicking it (or Enter / Space) emits `select` with the colony's name.
 */
export default defineComponent({
  name: 'ColonyTile',
  props: {
    colony: {
      type: Object as () => ColonyModel,
      required: true,
    },
    players: {
      type: Array as () => ReadonlyArray<PublicPlayerModel>,
      default: () => [],
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    /* True while a choice is open that this tile is not part of. */
    dimmed: {
      type: Boolean,
      default: false,
    },
    /* True when the track marker fades, so the build bonus under it shows. */
    fadeMarker: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select'],
  components: {
    Colony,
    PlayerCube,
    TradeFleetIcon,
  },
  computed: {
    metadata(): ColonyMetadata {
      return getColonyOrThrow(this.colony.name);
    },
    maxColonies(): number {
      return MAX_COLONIES_PER_TILE;
    },
    /* The trade income at the marker, for tiles whose trade row is a list of amounts. */
    tradeNow(): number | undefined {
      if (!this.colony.isActive || ICON_TRADE_ROWS.includes(this.colony.name)) {
        return undefined;
      }
      return this.metadata.trade.quantity[this.colony.trackPosition];
    },
    inactiveHint(): string {
      const resource = this.metadata.cardResource;
      return resource === undefined ?
        translateText('Not in play yet') :
        translateTextWithParams('Activates when a ${0} card is played', [resource]);
    },
  },
  methods: {
    playerName(color: Color): string {
      return this.players.find((p) => p.color === color)?.name ?? color;
    },
    select(): void {
      if (this.selectable) {
        this.$emit('select', this.colony.name);
      }
    },
  },
});
</script>
