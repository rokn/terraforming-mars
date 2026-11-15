<template>
  <div class="tm-main tm-main--setup">
    <section class="tm-setup-side">
      <div class="tm-panel tm-panel--large tm-setup-map" :class="{'tm-setup-map--colonies': shownView === 'colonies', 'tm-setup-map--turmoil': shownView === 'turmoil'}">
        <div class="tm-panel-inner">
          <div class="tm-board-head">
            <h2 class="tm-board-title" v-i18n>{{ viewTitle }}</h2>
            <CenterViewTabs :views="views" :modelValue="shownView" @update:modelValue="chooseView" />
            <span v-if="views.length < 2" class="tm-section-caption"><span v-i18n>Generation</span> {{ game.generation }}</span>
          </div>
          <ColoniesView v-if="shownView === 'colonies'" :colonies="game.colonies" :players="playerView.players" :columns="2" :fleets="false" />
          <TurmoilView v-else-if="shownView === 'turmoil' && game.turmoil !== undefined" :turmoil="game.turmoil" :players="playerView.players" :agendaStyle="game.gameOptions.politicalAgendasExtension" />
          <FitToBox v-else class="tm-board-fit" zoomable>
            <div class="player_home_block tm-board-block">
              <Board
                :spaces="game.spaces"
                :expansions="game.gameOptions.expansions"
                :venusScaleLevel="game.venusScaleLevel"
                :boardName="game.gameOptions.boardName"
                :aresData="game.aresData"
                :altVenusBoard="game.gameOptions.altVenusBoard"
                :tileView="tileView"
                @toggleTileView="$emit('toggleTileView')" />
              <PlanetaryTracks v-if="game.gameOptions.expansions.pathfinders" :tracks="game.pathfinders" :gameOptions="game.gameOptions" />
              <MoonBoard v-if="game.moon !== undefined" :model="game.moon" :tileView="tileView" />
              <DeltaProjectBoard v-if="game.gameOptions.expansions.deltaProject" :players="playerView.players" />
            </div>
          </FitToBox>
        </div>
      </div>

      <div v-if="playerView.players.length > 1" class="tm-panel tm-setup-order">
        <div class="tm-panel-inner">
          <h3 class="tm-section-title tm-section-title--small"><span v-i18n>Turn order</span></h3>
          <ol class="tm-setup-players">
            <li v-for="(p, idx) in playerView.players" :key="p.color" class="tm-setup-player" :class="{'tm-setup-player--me': p.color === thisPlayer.color}" data-test="setup-player">
              <span class="tm-setup-player-rank">{{ idx + 1 }}</span>
              <PlayerCube :color="p.color" :size="16" />
              <span class="tm-setup-player-name">{{ p.name }}<template v-if="p.color === thisPlayer.color"> · <span v-i18n>you</span></template></span>
              <span class="tm-setup-player-status" :class="{'tm-setup-player-status--busy': isChoosing(p)}" v-i18n>{{ isChoosing(p) ? 'Choosing' : 'Ready' }}</span>
            </li>
          </ol>
          <div class="tm-footer">
            <a :href="'/spectator?id=' + game.spectatorId" target="_blank" rel="noopener noreferrer" v-i18n>Spectator link</a>
            <PurgeWarning :expectedPurgeTimeMs="game.expectedPurgeTimeMs" />
          </div>
        </div>
      </div>

      <PoliticsCard v-if="game.turmoil !== undefined" :turmoil="game.turmoil" :players="playerView.players" @open="chooseView('turmoil')" />

      <MilestonesAwardsPanel v-if="playerView.players.length > 1"
        :milestones="game.milestones"
        :awards="game.awards"
        :players="playerView.players"
        :myColor="thisPlayer.color" />

    </section>

    <main class="tm-panel tm-panel--large tm-setup-pick" :aria-label="$t(heading)">
      <div class="tm-panel-inner">
        <div class="tm-ops-head">
          <h2 class="tm-section-title tm-section-title--large" v-i18n>{{ heading }}</h2>
          <span v-if="isActing" class="tm-ops-turn" v-i18n>Your move</span>
        </div>

        <template v-if="isInitialDraftingPhase">
          <h3 class="tm-section-title tm-section-title--small" v-i18n>Dealt cards</h3>
          <div class="tm-setup-cards">
            <div v-for="card in dealtCards" :key="card.name" class="cardbox">
              <Card :card="card" />
            </div>
          </div>
        </template>

        <template v-if="playerView.draftedCards.length > 0">
          <h3 class="tm-section-title tm-section-title--small" v-i18n>Drafted cards</h3>
          <div class="tm-setup-cards">
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card" />
            </div>
          </div>
        </template>

        <template v-if="playerView.pickedCorporationCard.length === 1">
          <div v-if="!isActing" class="tm-notice" data-test="setup-waiting">
            <span class="tm-notice-stripe"></span>
            <span class="tm-notice-body"><span class="tm-notice-title" v-i18n>Waiting for other players</span></span>
          </div>
          <h3 class="tm-section-title tm-section-title--small" v-i18n>Your selected cards</h3>
          <div class="tm-setup-cards" data-test="setup-picked">
            <div class="cardbox">
              <Card :card="playerView.pickedCorporationCard[0]" />
            </div>
            <template v-if="game.gameOptions.expansions.prelude">
              <div v-for="card in playerView.preludeCardsInHand" :key="card.name" class="cardbox">
                <Card :card="card" />
              </div>
            </template>
            <template v-if="game.gameOptions.expansions.ceo">
              <div v-for="card in playerView.ceoCardsInHand" :key="card.name" class="cardbox">
                <Card :card="card" />
              </div>
            </template>
            <div v-for="card in playerView.cardsInHand" :key="card.name" class="cardbox">
              <Card :card="card" />
            </div>
          </div>
        </template>

        <WaitingFor v-if="game.phase !== 'end'" :playerView="playerView" :waitingfor="playerView.waitingFor" :requestId="playerView.requestId" />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

import Board from '@/client/components/Board.vue';
import Card from '@/client/components/card/Card.vue';
import DeltaProjectBoard from '@/client/components/delta/DeltaProjectBoard.vue';
import FitToBox from '@/client/components/common/FitToBox.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import MilestonesAwardsPanel from '@/client/components/MilestonesAwardsPanel.vue';
import ColoniesView from '@/client/components/colonies/ColoniesView.vue';
import CenterViewTabs from '@/client/components/common/CenterViewTabs.vue';
import {CenterView, centerViews, loadCenterView, saveCenterView} from '@/client/utils/centerView';
import WaitingFor from '@/client/components/WaitingFor.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import TurmoilView from '@/client/components/turmoil/TurmoilView.vue';
import PoliticsCard from '@/client/components/turmoil/PoliticsCard.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import PlanetaryTracks from '@/client/components/pathfinders/PlanetaryTracks.vue';
import {CardModel} from '@/common/models/CardModel';
import {Phase} from '@/common/Phase';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {TileView} from './board/TileView';

export default defineComponent({
  name: 'PlayerSetupView',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    tileView: {
      type: String as () => TileView,
      required: true,
    },
  },
  emits: ['toggleTileView'],
  data(): {centerView: CenterView} {
    return {
      // The view the player chose for the map panel.
      centerView: loadCenterView() ?? 'mars',
    };
  },
  computed: {
    views(): Array<CenterView> {
      return centerViews(this.game);
    },
    shownView(): CenterView {
      return this.views.includes(this.centerView) ? this.centerView : 'mars';
    },
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    isInitialDraftingPhase(): boolean {
      return (this.game.phase === Phase.INITIALDRAFTING) && this.game.gameOptions.initialDraftVariant;
    },
    isActing(): boolean {
      return this.playerView.waitingFor !== undefined;
    },
    heading(): string {
      if (this.isInitialDraftingPhase) {
        return 'Draft your starting cards';
      }
      return this.playerView.pickedCorporationCard.length === 1 ? 'Ready to start' : 'Choose your start';
    },
    boardTitle(): string {
      return this.game.gameOptions.boardName.replaceAll('_', ' ');
    },
    viewTitle(): string {
      switch (this.shownView) {
      case 'colonies':
        return 'Colonies';
      case 'turmoil':
        return 'Turmoil';
      default:
        return this.boardTitle;
      }
    },
    dealtCards(): Array<CardModel> {
      const v = this.playerView;
      return [...v.dealtCorporationCards, ...v.dealtPreludeCards, ...v.dealtCeoCards, ...v.dealtProjectCards];
    },
  },
  components: {
    Board,
    Card,
    DeltaProjectBoard,
    FitToBox,
    PlayerCube,
    MilestonesAwardsPanel,
    ColoniesView,
    CenterViewTabs,
    WaitingFor,
    PurgeWarning,
    TurmoilView,
    PoliticsCard,
    PlanetaryTracks,
    MoonBoard,
  },
  methods: {
    chooseView(view: CenterView): void {
      this.centerView = view;
      saveCenterView(view);
    },
    /* True while `player` still has to choose their starting cards. */
    isChoosing(player: PublicPlayerModel): boolean {
      return player.needsToDraft === true || player.needsToResearch === true;
    },
  },
});
</script>
