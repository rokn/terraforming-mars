<template>
  <section v-show="isVisible()" class="tm-tableau" :style="{'--tm-player': playerColor}" :aria-label="player.name">
    <div :class="'player_translucent_bg_color_' + player.color" class="other_player_header tm-tableau-header">
      <div class="tm-tableau-title">
        <PlayerCube :color="player.color" :size="44" />
        <div class="tm-tableau-names">
          <span class="tm-tableau-meta">
            {{ player.name }}<template v-if="isPassed"> · <span v-i18n>passed</span></template> · {{ player.cardsInHandNbr }} <span v-i18n>cards in hand</span>
          </span>
          <span class="player_name tm-tableau-corp">
            <span v-i18n>{{ corporationName }}</span>
          </span>
        </div>
      </div>
      <div class="tm-tableau-stats">
        <div class="tm-stat"><span class="tm-stat-label" v-i18n>TR</span><span class="tm-stat-value">{{ player.terraformRating }}</span></div>
        <div v-if="showVictoryPoints" class="tm-stat"><span class="tm-stat-label" v-i18n>VP now</span><span class="tm-stat-value" data-test="vp">{{ player.victoryPointsBreakdown.total }}</span></div>
        <div class="tm-stat"><span class="tm-stat-label" v-i18n>Cards played</span><span class="tm-stat-value">{{ player.tableau.length }}</span></div>
        <AppButton size="big" type="close" @click="hideMe" :disableOnServerBusy="false" align="right" />
      </div>
    </div>
    <div class="other_player_cont menu tm-tableau-body">
      <template v-if="playerView !== undefined">
        <h3 class="tm-section-title" v-i18n>Stockpile &amp; production</h3>
        <ResourceStockpile :player="player" />
        <h3 class="tm-section-title" v-i18n>Tags</h3>
        <PlayerTags class="tm-tags" :player="player" :playerView="playerView" :hideZeroTags="true" />
      </template>
      <div v-if="player.tableau.length > 0" class="player_home_block">
        <h3 v-if="playerView !== undefined" class="tm-section-title" v-i18n>Played cards</h3>
        <div>
          <div v-for="card in getCardsByType(player.tableau, [CardType.CORPORATION])" :key="card.name" class="cardbox">
            <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color" />
          </div>
          <div v-for="card in getCardsByType(player.tableau, [CardType.PRELUDE])" :key="card.name" class="cardbox cardbox--prelude" data-test="tableau-prelude">
            <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color" />
          </div>
          <div v-for="card in getCardsByType(player.tableau, [CardType.CEO])" :key="card.name" class="cardbox">
            <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color" />
          </div>

          <div v-for="card in sortActiveCards(getCardsByType(player.tableau, [CardType.ACTIVE]))" :key="card.name" class="cardbox">
            <Card :card="card" :actionUsed="isCardActivated(card, player)" :cubeColor="player.color" />
          </div>
          <StackedCards :cards="getCardsByType(player.tableau, [CardType.AUTOMATED])" :player="player" />
          <StackedCards :cards="getCardsByType(player.tableau, [CardType.EVENT])" :player="player" />
        </div>
      </div>
      <div v-if="player.selfReplicatingRobotsCards.length > 0" class="player_home_block">
        <span v-i18n>Self-replicating Robots cards</span>
        <div>
          <div v-for="card in player.selfReplicatingRobotsCards" :key="card.name" class="cardbox">
            <Card :card="card" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script lang="ts">

import {defineComponent} from 'vue';

import StackedCards from '@/client/components/StackedCards.vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {vueRoot} from '@/client/components/vueRoot';
import Card from '@/client/components/card/Card.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType, isCardActivated} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {ViewModel} from '@/common/models/PlayerModel';
import {getCard} from '@/client/cards/ClientCardManifest';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import ResourceStockpile from '@/client/components/overview/ResourceStockpile.vue';
import PlayerTags from '@/client/components/overview/PlayerTags.vue';
import {playerHex} from '@/client/utils/gameTheme';

export default defineComponent({
  name: 'OtherPlayer',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    playerIndex: {
      type: Number,
      required: true,
    },
    /* The game being viewed. When present, the panel also shows the player's stockpile, tags and points. */
    playerView: {
      type: Object as () => ViewModel | undefined,
      default: undefined,
    },
  },
  components: {
    AppButton,
    PlayerCube,
    ResourceStockpile,
    PlayerTags,
    StackedCards,
    Card,
  },
  methods: {
    hideMe() {
      vueRoot(this).setVisibilityState('pinned_player_' + this.playerIndex, false);
    },
    isVisible() {
      return vueRoot(this).getVisibilityState(
        'pinned_player_' + this.playerIndex,
      );
    },
  },
  computed: {
    playerColor(): string {
      return playerHex(this.player.color);
    },
    corporationName(): string {
      const corp = this.player.tableau.find((card) => getCard(card.name)?.type === CardType.CORPORATION);
      return corp?.name ?? this.player.name;
    },
    isPassed(): boolean {
      return this.playerView?.game.passedPlayers.includes(this.player.color) ?? false;
    },
    showVictoryPoints(): boolean {
      return this.playerView?.game.gameOptions.showOtherPlayersVP === true;
    },
    CardType(): typeof CardType {
      return CardType;
    },
    getCardsByType(): typeof getCardsByType {
      return getCardsByType;
    },
    isCardActivated(): typeof isCardActivated {
      return isCardActivated;
    },
    sortActiveCards(): typeof sortActiveCards {
      return sortActiveCards;
    },
  },
});
</script>
