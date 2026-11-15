<template>
  <section class="tm-corps" :aria-label="$t('Corporations')">
    <h2 class="tm-section-title"><span v-i18n>Corporations</span> <span class="tm-section-caption" v-i18n>Turn order</span></h2>
    <button v-for="(player, idx) in playerView.players"
      :key="player.color"
      type="button"
      class="tm-corp"
      :class="rowClass(player)"
      :style="{'--tm-player': color(player)}"
      :aria-label="ariaLabel(player)"
      data-test="corp-row"
      @click="$emit('select', player.color)">
      <span class="tm-corp-inner">
        <span class="tm-corp-head">
          <PlayerCube :color="player.color" :size="18" />
          <span class="tm-corp-name" v-i18n>{{ corporationName(player) }}</span>
          <span v-if="idx === 0 && playerView.players.length > 1" class="tm-corp-first" v-i18n>1st</span>
          <span v-if="showTimers" class="tm-corp-timer" :class="{'tm-corp-timer--running': player.timer.running}" :title="$t('Time used')" data-test="timer">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
            <PlayerTimer :timer="player.timer" :live="playerView.game.phase !== 'end'" />
          </span>
          <span class="tm-corp-tr">
            <span class="tm-corp-tr-label" v-i18n>TR</span>
            <span class="tm-corp-tr-value" data-test="tr">{{ player.terraformRating }}</span>
          </span>
        </span>
        <span class="tm-corp-foot">
          <span class="tm-corp-player">{{ player.name }}<template v-if="isMe(player)"> · <span v-i18n>you</span></template></span>
          <span class="tm-corp-mc"><span class="tm-mc-chip" data-test="mc">{{ player.megacredits }}</span>M€</span>
          <span class="tm-corp-cards" :title="$t('Cards in hand')">
            <svg class="tm-corp-cards-icon" width="9" height="12" viewBox="0 0 9 12" aria-hidden="true"><rect x="0.75" y="0.75" width="7.5" height="10.5" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" /></svg>
            <span data-test="cards">{{ player.cardsInHandNbr }}</span> <span class="tm-corp-cards-label" v-i18n>cards</span>
          </span>
          <PlayerExpansionStats :player="player" :game="playerView.game" />
          <span class="tm-corp-status" :class="'tm-corp-status--' + statusFor(player)" data-test="status" v-i18n>{{ statusText(player) }}</span>
        </span>
      </span>
    </button>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {ActionLabel, getActionLabel} from '@/client/components/overview/ActionLabel';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import PlayerTimer from '@/client/components/overview/PlayerTimer.vue';
import PlayerExpansionStats from '@/client/components/overview/PlayerExpansionStats.vue';
import {playerHex} from '@/client/utils/gameTheme';

const STATUS_TEXT: Record<ActionLabel, string> = {
  'active': 'Acting',
  'next': 'Next',
  'passed': 'Passed',
  'drafting': 'Drafting',
  'researching': 'Researching',
  'none': 'Waiting',
  '': '',
};

export default defineComponent({
  name: 'CorporationsPanel',
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
  },
  emits: ['select'],
  components: {
    PlayerCube,
    PlayerTimer,
    PlayerExpansionStats,
  },
  computed: {
    showTimers(): boolean {
      return this.playerView.game.gameOptions.showTimers;
    },
  },
  methods: {
    isMe(player: PublicPlayerModel): boolean {
      return player.color === this.playerView.thisPlayer?.color;
    },
    color(player: PublicPlayerModel): string {
      return playerHex(player.color);
    },
    corporationName(player: PublicPlayerModel): string {
      const corp = player.tableau.find((card) => getCard(card.name)?.type === CardType.CORPORATION);
      return corp?.name ?? player.name;
    },
    statusFor(player: PublicPlayerModel): ActionLabel {
      return getActionLabel(this.playerView, player);
    },
    statusText(player: PublicPlayerModel): string {
      return STATUS_TEXT[this.statusFor(player)];
    },
    rowClass(player: PublicPlayerModel): Record<string, boolean> {
      return {
        'tm-corp--me': this.isMe(player),
        'tm-corp--passed': this.statusFor(player) === 'passed',
      };
    },
    ariaLabel(player: PublicPlayerModel): string {
      return `${this.corporationName(player)}, ${player.name}, TR ${player.terraformRating}`;
    },
  },
});
</script>
