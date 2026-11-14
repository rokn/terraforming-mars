<template>
  <div id="player-home" class="tm-game" :class="{'with-turmoil': game.turmoil, 'tm-game--with-sidebar': showSidebar, 'tm-app': true}">
    <GameHeader :playerView="playerView" @openLog="openPanel('log')" />

    <Sidebar v-if="showSidebar"
      :actingPlayer="isPlayerActing(playerView)"
      :playerColor="thisPlayer.color"
      :generation="game.generation"
      :coloniesCount="game.colonies.length"
      :temperature="game.temperature"
      :oxygen="game.oxygenLevel"
      :oceans="game.oceans"
      :venus="game.venusScaleLevel"
      :turmoil="game.turmoil"
      :moonData="game.moon"
      :gameOptions="game.gameOptions"
      :playerNumber="playerView.players.length"
      :lastSoloGeneration="game.lastSoloGeneration"
      :deckSize="game.deckSize"
      :discardPileSize="game.discardPileSize"
      :otherDeckSizes="game.otherDeckSizes" />

    <template v-if="hasTableau">
      <div class="tm-main" :class="{'tm-main--research': isResearching, 'tm-main--sheet': boardsOpen || panel !== undefined}">
        <aside class="tm-left">
          <a class="hotkey-target"></a>
          <CorporationsPanel :playerView="playerView" id="shortkey-playersoverview" @select="showPlayer" />
          <MilestonesAwardsPanel v-if="playerView.players.length > 1"
            :milestones="game.milestones"
            :awards="game.awards"
            :players="playerView.players"
            :myColor="thisPlayer.color" />
        </aside>

        <main class="tm-center tm-panel tm-panel--large">
          <div class="tm-panel-inner">
            <div class="tm-board-head">
              <h2 class="tm-board-title" v-i18n>{{ boardTitle }}</h2>
              <span class="tm-section-caption" data-test="board-stats">
                {{ marsSpaceCount }} <span v-i18n>areas</span> · {{ placedTileCount }} <span v-i18n>tiles placed</span>
              </span>
            </div>
            <div v-if="game.phase === 'end'" class="tm-notice">
              <span class="tm-notice-stripe"></span>
              <span class="tm-notice-body">
                <span class="tm-notice-title" v-i18n>This game is over!</span>
                <a class="tm-button tm-button--primary" :href="'the-end?id='+ playerView.id" v-i18n>Go to game results</a>
              </span>
            </div>
            <FitToBox class="tm-board-fit" zoomable>
              <div class="player_home_block tm-board-block">
                <GameBoardView
                  ref="gameBoardView"
                  :game="game"
                  :tileView="tileView"
                  :players="playerView.players"
                  :showMilestonesAndAwards="false"
                  @toggleTileView="cycleTileView()"
                />
              </div>
            </FitToBox>
          </div>
        </main>

        <aside class="tm-right tm-panel" :aria-label="$t('Operations')">
          <div class="tm-panel-inner player_home_block--actions">
            <a class="hotkey-target"></a>
            <a name="actions" class="player_home_anchor"></a>
            <div class="tm-ops-head">
              <h2 class="tm-section-title tm-section-title--large" v-i18n>Operations</h2>
              <span v-if="isPlayerActing(playerView)" class="tm-ops-turn" v-i18n>Your move</span>
            </div>
            <WaitingFor v-if="game.phase !== 'end'" actionMenu :modal="followUpModal" @dismiss="dismissFollowUp()" :playerView="playerView" :waitingfor="playerView.waitingFor" :requestId="playerView.requestId" />
          </div>
        </aside>

        <SidePanel :open="boardsOpen" title="Player boards" zoomable :initialZoom="0.7" @close="closeBoards()">
          <template #tabs>
            <div class="tm-sheet-tabs" role="tablist">
              <button v-for="p in playerView.players" :key="p.color" type="button" role="tab"
                class="tm-sheet-tab" :class="{'tm-sheet-tab--on': p.color === boardsColor}"
                :aria-selected="p.color === boardsColor" data-test="board-tab" @click="showPlayer(p.color)">
                <PlayerCube :color="p.color" :size="16" />
                <span>{{ p.color === thisPlayer.color ? $t('You') : p.name }}</span>
              </button>
            </div>
          </template>

          <div v-show="showOwnBoard" class="tm-own-board" :class="{'tm-own-board--actions': focusingActions}" id="played-cards">
            <div v-if="focusingActions" class="tm-actions-banner" data-test="actions-banner">
              <span v-i18n>Click a highlighted card to use its action</span>
              <span class="tm-section-caption">{{ tableauActionable.length }} <span v-i18n>available</span></span>
            </div>
            <div class="tm-own-board-row">
              <div>
                <h3 class="tm-section-title" v-i18n>Tags</h3>
                <PlayerTags class="tm-tags" :player="thisPlayer" :playerView="playerView" :hideZeroTags="true" />
              </div>
              <div class="hiding-card-button-row">
                <div class="played-cards-filters">
                  <div :class="getHideButtonClass('ACTIVE')" @click.prevent="toggle('ACTIVE')">
                    <div class="played-cards-count">{{ activeTableauCount }}</div>
                    <div class="played-cards-selection" v-i18n>{{ getToggleLabel('ACTIVE') }}</div>
                  </div>
                  <div :class="getHideButtonClass('AUTOMATED')" @click.prevent="toggle('AUTOMATED')">
                    <div class="played-cards-count">{{ automatedTableauCount }}</div>
                    <div class="played-cards-selection" v-i18n>{{ getToggleLabel('AUTOMATED') }}</div>
                  </div>
                  <div :class="getHideButtonClass('EVENT')" @click.prevent="toggle('EVENT')">
                    <div class="played-cards-count">{{ eventTableauCount }}</div>
                    <div class="played-cards-selection" v-i18n>{{ getToggleLabel('EVENT') }}</div>
                  </div>
                </div>
                <div class="text-overview" v-i18n>[ toggle cards filters ]</div>
              </div>
            </div>
            <h3 class="tm-section-title" v-i18n>Played Cards</h3>
            <div class="player_home_block player_home_block--cards">
              <div v-for="card in getCardsByType(thisPlayer.tableau, [CardType.CORPORATION])" :key="card.name" class="cardbox" :class="actionClass(card.name)" @click="useAction(card.name)">
                <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color" />
              </div>
              <div v-for="card in getCardsByType(thisPlayer.tableau, [CardType.CEO])" :key="card.name" class="cardbox" :class="actionClass(card.name)" @click="useAction(card.name)">
                <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color" />
              </div>
              <div v-show="isVisible('ACTIVE') || focusingActions" v-for="card in activeTableauCards" :key="card.name" class="cardbox" :class="actionClass(card.name)" @click="useAction(card.name)">
                <Card :card="card" :actionUsed="isCardActivated(card, thisPlayer)" :cubeColor="thisPlayer.color" />
              </div>
              <StackedCards v-show="isVisible('AUTOMATED')" :cards="automatedTableauCards" />
              <StackedCards v-show="isVisible('EVENT')" :cards="eventTableauCards" />
            </div>

            <template v-if="thisPlayer.selfReplicatingRobotsCards.length > 0">
              <h3 class="tm-section-title" v-i18n>Self-replicating Robots cards</h3>
              <div class="player_home_block">
                <div v-for="card in thisPlayer.selfReplicatingRobotsCards" :key="card.name" class="cardbox">
                  <Card :card="card" />
                </div>
              </div>
            </template>

            <template v-if="thisPlayer.underworldData.tokens.length > 0">
              <h3 class="tm-section-title" v-i18n>Claimed Underground Resource Tokens</h3>
              <UndergroundTokens :underworldData="thisPlayer.underworldData" />
            </template>
          </div>

          <div class="tm-tableaus">
            <OtherPlayer v-for="(player, index) in otherPlayers" :key="player.color" :player="player" :playerIndex="index" :playerView="playerView" />
          </div>
        </SidePanel>

        <SidePanel :open="panel === 'log'" title="Game log" @close="panel = undefined">
          <a class="hotkey-target"></a>
          <div class="player_home_block nofloat" id="log">
            <LogPanel :viewModel="playerView" :step="game.step" @spaceClicked="onSpaceClicked" />
          </div>
          <div class="tm-footer">
            <a :href="'/spectator?id=' +game.spectatorId" target="_blank" rel="noopener noreferrer" v-i18n>Spectator link</a>
            <PurgeWarning :expectedPurgeTimeMs="game.expectedPurgeTimeMs" />
          </div>
        </SidePanel>

        <SidePanel v-if="game.colonies.length > 0" :open="panel === 'colonies'" title="Colonies" @close="panel = undefined">
          <div class="player_home_block" ref="colonies" id="shortkey-colonies">
            <a name="colonies" class="player_home_anchor hotkey-target"></a>
            <div class="colonies-fleets-cont">
              <div class="colonies-player-fleets" v-for="colonyPlayer in playerView.players" :key="colonyPlayer.color">
                <div :class="'colonies-fleet colonies-fleet-'+ colonyPlayer.color" v-for="idx in getFleetsCountRange(colonyPlayer)" :key="idx"></div>
              </div>
            </div>
            <div class="player_home_colony_cont">
              <div class="player_home_colony" v-for="colony in game.colonies" :key="colony.name">
                <Colony :colony="colony" :active="colony.isActive" />
              </div>
            </div>
          </div>
        </SidePanel>

        <SidePanel v-if="playerView.draftedCards.length > 0" :open="panel === 'drafted'" title="Drafted cards" @close="panel = undefined">
          <div class="player_home_block">
            <div v-for="card in playerView.draftedCards" :key="card.name" class="cardbox">
              <Card :card="card" />
            </div>
          </div>
        </SidePanel>
      </div>

      <section class="tm-colony" :aria-label="$t('Your colony')">
        <div class="tm-colony-stock">
          <h2 class="tm-section-title tm-section-title--small"><span v-i18n>Stockpile</span> <span class="tm-section-caption" v-i18n>Amount · production / gen</span></h2>
          <ResourceStockpile :player="thisPlayer" />
        </div>

        <div class="tm-colony-hand" :class="{'tm-colony-hand--pick': pickingFromHand}" id="shortkey-hand">
          <a name="cards" class="player_home_anchor"></a>
          <div class="tm-hand-head">
            <h2 class="tm-section-title tm-section-title--small">
              <span v-i18n>Hand</span>
              <span class="tm-section-caption" data-test="hand-count">{{ cardsInHandCount }} <span v-i18n>cards</span></span>
              <span v-if="pickingFromHand" class="tm-hand-pick" data-test="hand-pick" v-i18n>Click a card to play it</span>
            </h2>
            <div class="tm-hand-tools" v-if="cardsInHandCount > 0">
              <button type="button" class="tm-chip-button" :class="{'tm-chip-button--on': isVisible('HAND')}" :aria-pressed="isVisible('HAND')" @click="toggle('HAND')" v-i18n>Show</button>
              <CardSortButtons v-model:sortOrder="handSortOrder" />
            </div>
          </div>
          <div v-if="cardsInHandCount === 0" class="tm-empty" v-i18n>No cards in hand</div>
          <SortableCards v-else v-show="isVisible('HAND') || pickingFromHand" class="tm-hand" :playerId="playerView.id" :cards="allCardsInHand" :playable="handPlayable" v-model:sortOrder="handSortOrder" @play="playCard" />
        </div>

        <nav class="tm-dock-nav" :aria-label="$t('Panels')">
          <button type="button" class="tm-dock-button" :class="{'tm-dock-button--on': showOwnBoard}" data-test="open-tableau" :aria-keyshortcuts="'B'" @click="toggleOwnBoard()">
            <span class="tm-dock-button-label" v-i18n>Your tableau</span>
            <span class="tm-dock-button-count">{{ thisPlayer.tableau.length }}</span>
            <kbd class="tm-kbd" :title="$t('Shortcut')">B</kbd>
          </button>
          <button type="button" class="tm-dock-button" :class="{'tm-dock-button--on': panel === 'log'}" data-test="open-log" @click="openPanel('log')">
            <span class="tm-dock-button-label" v-i18n>Game log</span>
          </button>
          <button v-if="game.colonies.length > 0" type="button" class="tm-dock-button" :class="{'tm-dock-button--on': panel === 'colonies'}" data-test="open-colonies" @click="openPanel('colonies')">
            <span class="tm-dock-button-label" v-i18n>Colonies</span>
            <span class="tm-dock-button-count">{{ game.colonies.length }}</span>
          </button>
          <button v-if="playerView.draftedCards.length > 0" type="button" class="tm-dock-button" :class="{'tm-dock-button--on': panel === 'drafted'}" data-test="open-drafted" @click="openPanel('drafted')">
            <span class="tm-dock-button-label" v-i18n>Drafted cards</span>
            <span class="tm-dock-button-count">{{ playerView.draftedCards.length }}</span>
          </button>
        </nav>
      </section>
    </template>

    <PlayerSetupView v-else :playerView="playerView" :tileView="tileView" @toggleTileView="cycleTileView()" />
    <KeyboardShortcuts v-show="keyboardShortcutOpened" @close="keyboardShortcutOpened = false" />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';

import Card from '@/client/components/card/Card.vue';
import WaitingFor from '@/client/components/WaitingFor.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import CardSortButtons from '@/client/components/CardSortButtons.vue';
import {SortOrder} from '@/client/utils/SortOrder';
import GameHeader from '@/client/components/GameHeader.vue';
import CorporationsPanel from '@/client/components/overview/CorporationsPanel.vue';
import MilestonesAwardsPanel from '@/client/components/MilestonesAwardsPanel.vue';
import ResourceStockpile from '@/client/components/overview/ResourceStockpile.vue';
import PlayerTags from '@/client/components/overview/PlayerTags.vue';
import OtherPlayer from '@/client/components/OtherPlayer.vue';
import {vueRoot} from '@/client/components/vueRoot';
import {SpaceType} from '@/common/boards/SpaceType';
import {Color} from '@/common/Color';
import {Phase} from '@/common/Phase';
import FitToBox from '@/client/components/common/FitToBox.vue';
import SidePanel from '@/client/components/common/SidePanel.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {actionableCards, playableCards, quickActions, requestAction, requestPlay} from '@/client/utils/quickActions';
import {isActionMenu} from '@/client/utils/actionKind';
import {KeyboardNavigation} from '@/client/components/KeyboardNavigation';
import {CardName} from '@/common/cards/CardName';
import StackedCards from '@/client/components/StackedCards.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import UndergroundTokens from '@/client/components/underworld/UndergroundTokens.vue';
import KeyboardShortcuts from '@/client/components/KeyboardShortcuts.vue';
import {getPreferences, Preferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {GameModel} from '@/common/models/GameModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardType} from '@/common/cards/CardType';
import {getCardsByType, isCardActivated} from '@/client/utils/CardUtils';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {CardModel} from '@/common/models/CardModel';
import {getCardOrThrow} from '../cards/ClientCardManifest';
import {HomeMixin} from '@/client/mixins/HomeMixin';

type PlayerHomeModel = {
  showHand: boolean;
  showActiveCards: boolean;
  showAutomatedCards: boolean;
  showEventCards: boolean;
  /** Whether the player boards panel shows this player's own tableau. */
  showOwnBoard: boolean;
  /** The side panel that is open, other than the player boards. */
  panel: Panel | undefined;
  /** Current sort order of the hand, or undefined before the player picks one and after they reorder by hand. */
  handSortOrder: SortOrder | undefined;
}

type Panel = 'log' | 'colonies' | 'drafted';

type ToggleableCardType = 'HAND' | 'ACTIVE' | 'AUTOMATED' | 'EVENT';

const typeToDataModel: Record<ToggleableCardType, {key: 'showHand' | 'showActiveCards' | 'showAutomatedCards' | 'showEventCards', preference: keyof Preferences}> = {
  HAND: {key: 'showHand', preference: 'hide_hand'},
  ACTIVE: {key: 'showActiveCards', preference: 'hide_active_cards'},
  AUTOMATED: {key: 'showAutomatedCards', preference: 'hide_automated_cards'},
  EVENT: {key: 'showEventCards', preference: 'hide_event_cards'},
} as const;

export default defineComponent({
  name: 'PlayerHome',
  mixins: [HomeMixin],
  data(): PlayerHomeModel {
    const preferences = getPreferences();
    return {
      showHand: !preferences.hide_hand,
      showActiveCards: !preferences.hide_active_cards,
      showAutomatedCards: !preferences.hide_automated_cards,
      showEventCards: !preferences.hide_event_cards,
      showOwnBoard: false,
      panel: undefined,
      handSortOrder: undefined,
    };
  },
  watch: {
    playerView() {
      const waitingFor = this.playerView.waitingFor;
      // Back to the main menu (or nothing to do): the quick action is over.
      if (waitingFor === undefined || waitingFor.optional || isActionMenu(waitingFor)) {
        quickActions.followUp = false;
      }
      // Picking a space needs the board: move panels out of the way.
      if (waitingFor?.type === 'space') {
        this.closeSidePanels();
      }
    },
    // Choosing cards in a dialog or at the start of research: side panels would only be in the way.
    followUpModal(open: boolean) {
      if (open) {
        this.closeSidePanels();
      }
    },
    isResearching(researching: boolean) {
      if (researching) {
        // A new generation: whatever quick action led here is over.
        quickActions.followUp = false;
        this.closeSidePanels();
      }
    },
    focusingActions(focus: boolean) {
      if (focus) {
        this.showPlayer(this.thisPlayer.color);
        this.$nextTick(() => document.querySelector('.tm-own-board .cardbox--actionable')?.scrollIntoView({behavior: 'smooth', block: 'nearest'}));
      }
    },
    showHand: function hide_hand() {
      PreferencesManager.INSTANCE.set('hide_hand', !this.showHand);
    },
    showActiveCards: function toggle_active_cards() {
      PreferencesManager.INSTANCE.set('hide_active_cards', !this.showActiveCards);
    },
    showAutomatedCards: function toggle_automated_cards() {
      PreferencesManager.INSTANCE.set('hide_automated_cards', !this.showAutomatedCards);
    },
    showEventCards: function toggle_event_cards() {
      PreferencesManager.INSTANCE.set('hide_event_cards', !this.showEventCards);
    },
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  computed: {
    thisPlayer(): PublicPlayerModel {
      return this.playerView.thisPlayer;
    },
    game(): GameModel {
      return this.playerView.game;
    },
    CardType(): typeof CardType {
      return CardType;
    },
    /* While this player is choosing an action, the hand cards they can play now. */
    handPlayable(): Array<CardName> | undefined {
      const waitingFor = this.playerView.waitingFor;
      return waitingFor !== undefined && !waitingFor.optional ? playableCards(waitingFor) : undefined;
    },
    /* While this player is choosing an action, the played cards whose action they can use now. */
    tableauActionable(): Array<CardName> {
      const waitingFor = this.playerView.waitingFor;
      return waitingFor !== undefined && !waitingFor.optional ? actionableCards(waitingFor) : [];
    },
    /* True while the action menu asks the player to pick a card on their tableau. */
    focusingActions(): boolean {
      return quickActions.focusActions;
    },
    /*
     * True when the server asks a follow-up question after a card was played or used from the hand or
     * tableau: it then shows in a dialog. Placing a tile stays in place, as it needs the board.
     */
    followUpModal(): boolean {
      const waitingFor = this.playerView.waitingFor;
      return quickActions.followUp && waitingFor !== undefined && !waitingFor.optional && !this.isResearching &&
        !isActionMenu(waitingFor) && waitingFor.type !== 'space';
    },
    /* True while the action menu asks the player to pick a card from their hand. */
    pickingFromHand(): boolean {
      return quickActions.highlight;
    },
    hasTableau(): boolean {
      return this.thisPlayer.tableau.length > 0;
    },
    /* The opponent whose board is pinned open, if any. */
    pinnedColor(): Color | undefined {
      const root = vueRoot(this);
      return this.otherPlayers.find((_, idx) => root.getVisibilityState('pinned_player_' + idx))?.color;
    },
    /* The player whose board the player boards panel shows. */
    boardsColor(): Color | undefined {
      return this.showOwnBoard ? this.thisPlayer.color : this.pinnedColor;
    },
    boardsOpen(): boolean {
      return this.boardsColor !== undefined;
    },
    /* True while players pick cards, when the operations panel takes the full width. */
    isResearching(): boolean {
      return this.game.phase === Phase.RESEARCH || this.game.phase === Phase.DRAFTING;
    },
    /* True when the game shows information that only the sidebar displays (Turmoil, The Moon). */
    showSidebar(): boolean {
      return this.game.turmoil !== undefined || this.game.moon !== undefined;
    },
    boardTitle(): string {
      return this.game.gameOptions.boardName.replaceAll('_', ' ');
    },
    marsSpaceCount(): number {
      return this.game.spaces.filter((s) => s.spaceType !== SpaceType.COLONY).length;
    },
    placedTileCount(): number {
      return this.game.spaces.filter((s) => s.spaceType !== SpaceType.COLONY && s.tileType !== undefined).length;
    },
    /* The other players, starting with the one after this player in turn order. */
    otherPlayers(): Array<PublicPlayerModel> {
      const players = this.playerView.players;
      const idx = players.findIndex((p) => p.color === this.thisPlayer.color);
      return players.slice(idx + 1).concat(players.slice(0, idx));
    },
    cardsInHandCount(): number {
      const playerView = this.playerView;
      return playerView.cardsInHand.length + playerView.preludeCardsInHand.length + playerView.ceoCardsInHand.length;
    },
    allCardsInHand(): Array<CardModel> {
      const playerView = this.playerView;
      return playerView.preludeCardsInHand
        .concat(playerView.ceoCardsInHand)
        .concat(playerView.cardsInHand);
    },
    activeTableauCount(): number {
      return getCardsByType(this.thisPlayer.tableau, [CardType.ACTIVE]).length;
    },
    automatedTableauCount(): number {
      return getCardsByType(this.thisPlayer.tableau, [CardType.AUTOMATED, CardType.PRELUDE]).length;
    },
    eventTableauCount(): number {
      return getCardsByType(this.thisPlayer.tableau, [CardType.EVENT]).length;
    },
    activeTableauCards(): Array<CardModel> {
      const cards = getCardsByType(this.thisPlayer.tableau, [CardType.ACTIVE, CardType.PRELUDE]);
      return [...sortActiveCards(cards.filter((c) => this.isActive(c)))];
    },
    automatedTableauCards(): Array<CardModel> {
      const cards = getCardsByType(this.thisPlayer.tableau, [CardType.AUTOMATED, CardType.PRELUDE]);
      return cards.filter((c) => this.isNotActive(c));
    },
    eventTableauCards(): Array<CardModel> {
      return [...getCardsByType(this.thisPlayer.tableau, [CardType.EVENT])];
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

  mounted() {
    window.addEventListener('keydown', this.onShortcut);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onShortcut);
  },
  components: {
    Card,
    FitToBox,
    SidePanel,
    PlayerCube,
    GameHeader,
    CorporationsPanel,
    MilestonesAwardsPanel,
    ResourceStockpile,
    PlayerTags,
    OtherPlayer,
    WaitingFor,
    Sidebar,
    Colony,
    LogPanel,
    SortableCards,
    CardSortButtons,
    GameBoardView,
    PlayerSetupView,
    StackedCards,
    PurgeWarning,
    UndergroundTokens,
    KeyboardShortcuts,
  },
  methods: {
    isPlayerActing(playerView: PlayerViewModel) : boolean {
      return playerView.players.length > 1 && playerView.waitingFor !== undefined && !playerView.waitingFor.optional;
    },
    actionClass(card: CardName): string | undefined {
      return this.tableauActionable.includes(card) ? 'cardbox--actionable' : undefined;
    },
    /* Uses the action of the played card `card`, when it is available. */
    useAction(card: CardName): void {
      if (this.tableauActionable.includes(card)) {
        requestAction(card);
      }
    },
    /* Opens the play-card action for `card`, so the player only has to pay. */
    playCard(card: CardName): void {
      requestPlay(card);
    },
    /* Opens the player boards panel on the player with `color`. */
    showPlayer(color: Color): void {
      const root = vueRoot(this);
      this.panel = undefined;
      this.showOwnBoard = color === this.thisPlayer.color;
      if (!this.showOwnBoard) {
        quickActions.focusActions = false;
      }
      this.otherPlayers.forEach((p, idx) => root.setVisibilityState('pinned_player_' + idx, p.color === color));
    },
    /* Moves a follow-up question out of its dialog and into the operations panel. */
    dismissFollowUp(): void {
      quickActions.followUp = false;
    },
    closeSidePanels(): void {
      this.closeBoards();
      this.panel = undefined;
    },
    /* Opens this player's tableau, or closes it if it is showing. */
    toggleOwnBoard(): void {
      if (this.showOwnBoard) {
        this.closeBoards();
      } else {
        this.showPlayer(this.thisPlayer.color);
      }
    },
    /* Enter presses the main button of the topmost dialog. */
    confirmDialog(event: KeyboardEvent): void {
      const target = event.target;
      if (target instanceof HTMLElement && ['button', 'a', 'textarea', 'select'].includes(target.nodeName.toLowerCase())) {
        return;
      }
      const dialogs = (this.$el as HTMLElement).querySelectorAll<HTMLElement>('.tm-play-modal');
      const dialog = dialogs[dialogs.length - 1];
      if (dialog === undefined) {
        return;
      }
      const primary = dialog.querySelectorAll<HTMLButtonElement>('[data-primary]:not(:disabled)');
      const submits = dialog.querySelectorAll<HTMLButtonElement>('.btn-submit:not(:disabled)');
      const button = primary.length > 0 ? primary[primary.length - 1] : (submits.length === 1 ? submits[0] : undefined);
      if (button !== undefined) {
        event.preventDefault();
        button.click();
      }
    },
    onShortcut(event: KeyboardEvent): void {
      if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        this.confirmDialog(event);
        return;
      }
      if (event.code !== KeyboardNavigation.TABLEAU || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || ['input', 'textarea', 'select'].includes(target.nodeName.toLowerCase()))) {
        return;
      }
      if (this.hasTableau) {
        event.preventDefault();
        this.toggleOwnBoard();
      }
    },
    closeBoards(): void {
      quickActions.focusActions = false;
      const root = vueRoot(this);
      this.showOwnBoard = false;
      this.otherPlayers.forEach((_, idx) => root.setVisibilityState('pinned_player_' + idx, false));
    },
    /* Opens `panel`, or closes it when it is already open. */
    openPanel(panel: Panel): void {
      if (this.panel === panel) {
        this.panel = undefined;
        return;
      }
      this.closeBoards();
      this.panel = panel;
    },
    getFleetsCountRange(player: PublicPlayerModel): Array<number> {
      const fleetsRange = [];
      for (let i = 0; i < player.fleetSize - player.tradesThisGeneration; i++) {
        fleetsRange.push(i);
      }
      return fleetsRange;
    },
    toggle(type: ToggleableCardType): void {
      this[typeToDataModel[type].key] = !this[typeToDataModel[type].key];
    },
    isVisible(type: ToggleableCardType): boolean {
      return this[typeToDataModel[type].key];
    },
    getToggleLabel(hideType: ToggleableCardType): string {
      const val = this[typeToDataModel[hideType].key];
      return val ? '✔' : '';
    },
    getHideButtonClass(hideType: ToggleableCardType): string {
      const prefix = 'hiding-card-button ';
      switch (hideType) {
      case 'HAND':
        return prefix + (this.showHand ? 'hand-toggle' : 'hand-toggle-transparent');
      case 'ACTIVE':
        return prefix + (this.showActiveCards ? 'active' : 'active-transparent');
      case 'AUTOMATED':
        return prefix + (this.showAutomatedCards ? 'automated' : 'automated-transparent');
      case 'EVENT':
        return prefix + (this.showEventCards ? 'event' : 'event-transparent');
      }
    },
    isActive(cardModel: CardModel): boolean {
      const card = getCardOrThrow(cardModel.name);
      return card.type === CardType.ACTIVE || card.hasAction;
    },
    isNotActive(cardModel: CardModel): boolean {
      return !getCardOrThrow(cardModel.name).hasAction;
    },
  },
});

</script>
