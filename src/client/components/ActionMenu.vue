<template>
  <div class="tm-actions wf-options">
    <template v-if="openOption === undefined || detailInModal">
      <div v-if="showtitle" class="tm-actions-title">{{ $t(playerinput.title) }}</div>
      <div v-if="playerinput.warning !== undefined" class="card-warning">({{ $t(playerinput.warning) }})</div>
      <p v-if="worldGovernment" class="tm-actions-note" data-test="world-government-note" v-i18n>The World Government raises one global parameter. You gain no TR or bonuses from it.</p>

      <div class="tm-actions-grid">
        <button v-for="entry in mainEntries" :key="entry.idx" type="button"
          class="tm-action-tile" :class="['tm-action-tile--' + entry.kind, {'tm-action-tile--muted': entry.muted, 'tm-action-tile--wide': entry.wide, 'tm-action-tile--picking': isPicking(entry.kind)}]"
          :aria-pressed="entry.kind === 'play' || entry.kind === 'card-action' ? isPicking(entry.kind) : undefined"
          data-test="action-tile" @click="choose(entry)">
          <svg class="tm-action-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="iconPath(entry.kind)" />
          </svg>
          <span class="tm-action-text">
            <span class="tm-action-label">{{ $t(entry.option.title) }}</span>
            <span v-if="isPicking('play') && entry.kind === 'play'" class="tm-action-hint tm-action-hint--picking" data-test="action-hint" v-i18n>Pick a card from your hand</span>
            <span v-else-if="isPicking('card-action') && entry.kind === 'card-action'" class="tm-action-hint tm-action-hint--picking" data-test="action-hint" v-i18n>Pick a blue card on your tableau</span>
            <span v-else-if="entry.hint !== undefined" class="tm-action-hint" data-test="action-hint">{{ entry.hint }}</span>
          </span>
        </button>
      </div>

      <div v-if="endEntries.length > 0" class="tm-actions-end">
        <button v-for="entry in endEntries" :key="entry.idx" type="button"
          class="tm-action-tile tm-action-tile--end" :class="'tm-action-tile--' + entry.kind"
          data-test="action-tile" @click="open(entry.idx)">
          <svg class="tm-action-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path :d="iconPath(entry.kind)" />
          </svg>
          <span class="tm-action-label">{{ $t(entry.option.title) }}</span>
        </button>
      </div>
    </template>

    <!-- Card lists (sell patents, standard projects…) open in a large dialog; other actions open in place. -->
    <Teleport v-if="openOption !== undefined" to="#player-home" :disabled="!detailInModal" defer>
      <div :class="{'tm-play-modal': detailInModal}" @click.self="detailInModal && close()">
        <div class="tm-action-detail" :class="{'tm-play-modal-box tm-play-modal-box--wide wf-root': detailInModal}" data-test="action-detail">
          <div class="tm-action-detail-head" :class="{'tm-play-modal-head': detailInModal}">
            <button v-if="entries.length > 1 && !detailInModal" type="button" class="tm-action-back" data-test="action-back" @click="close()">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
              <span v-i18n>All actions</span>
            </button>
            <span class="tm-action-detail-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path :d="iconPath(kindOf(openOption))" />
              </svg>
              {{ $t(openOption.title) }}
            </span>
            <button v-if="detailInModal" type="button" class="tm-sheet-close" :title="$t('Close')" :aria-label="$t('Close')" data-test="action-close" @click="close()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <div :class="{'tm-play-modal-body': detailInModal}">
            <PlayerInputFactory ref="inputfactory"
              :key="openKey"
              :playerView="playerView"
              :playerinput="openOption"
              :onsave="saved"
              :showsave="showsave && childSavesItself(openOption)"
              :showtitle="false" />
            <div v-if="showsave && !childSavesItself(openOption)" class="tm-action-confirm wf-action">
              <AppButton :title="$t(openOption.buttonLabel)" type="submit" size="normal" @click="saveData" data-primary />
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="#player-home" :disabled="!hasHome" defer>
      <div v-if="quickPlay !== undefined" class="tm-play-modal" data-test="play-modal" @click.self="closeQuickPlay()">
        <div class="tm-play-modal-box wf-root" role="dialog" aria-modal="true" :aria-label="$t(quickPlay.input.title)">
          <div class="tm-play-modal-head">
            <h2 class="tm-section-title tm-section-title--large" v-i18n>Play card</h2>
            <button type="button" class="tm-sheet-close" :title="$t('Close')" :aria-label="$t('Close')" data-test="play-modal-close" @click="closeQuickPlay()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" /></svg>
            </button>
          </div>
          <div class="tm-play-modal-body">
            <PlayerInputFactory ref="quickfactory"
              :playerView="playerView"
              :playerinput="quickPlay.input"
              :onsave="quickSaved"
              :showsave="false"
              :showtitle="false" />
          </div>
          <div class="tm-play-modal-foot">
            <button type="button" class="tm-button tm-button--secondary" data-test="play-modal-cancel" @click="closeQuickPlay()" v-i18n>Cancel</button>
            <AppButton :title="$t(quickPlay.input.buttonLabel)" type="submit" size="normal" @click="saveQuickPlay" data-primary />
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {ViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {quickActions, takeRequestedAction, takeRequestedCard} from '@/client/utils/quickActions';
import {ActionKind, actionKind} from '@/client/utils/actionKind';
import {CardName} from '@/common/cards/CardName';
import {needsColonies, needsParties} from '@/client/utils/centerView';
import {Phase} from '@/common/Phase';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {MAX_VENUS_SCALE} from '@/common/constants';

type Entry = {
  /** Index in `playerinput.options`. */
  idx: number,
  option: PlayerInputModel,
  kind: ActionKind,
  hint: string | undefined,
  muted: boolean,
  wide: boolean,
};

const ICONS: Record<ActionKind, string> = {
  'play': 'M7 3h10v18H7zM10 7h4M10 11h4',
  'standard': 'M12 2l9 5v10l-9 5-9-5V7zM12 8v8M8 12h8',
  'card-action': 'M13 2L4 14h7l-1 8 9-12h-7z',
  'milestone': 'M5 21V4h11l-2 4 2 4H5',
  'award': 'M12 15a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM8.5 14L7 22l5-3 5 3-1.5-8',
  'plants': 'M5 19c0-8 6-14 15-14 0 9-6 15-14 15M5 19l7-7',
  'heat': 'M12 22a7 7 0 0 0 7-7c0-5-7-13-7-13S5 10 5 15a7 7 0 0 0 7 7zM12 18a3 3 0 0 0 3-3',
  'sell': 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4',
  'trade': 'M4 17h13l-3 3M20 7H7l3-3',
  'colony': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18',
  'delegate': 'M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  'policy': 'M3 21h18M5 18V10M10 18V10M14 18V10M19 18V10M2 10l10-7 10 7z',
  'pass': 'M5 21V4M5 4h12l-3 4 3 4H5',
  'end': 'M5 12h14M13 6l6 6-6 6',
  'undo': 'M9 14L4 9l5-5M4 9h11a5 5 0 0 1 0 10h-3',
  'other': 'M12 5v14M5 12h14',
};

const END_KINDS: ReadonlyArray<ActionKind> = ['pass', 'end', 'undo'];

/* The number of colony tiles to choose from in `option`. */
function colonyChoices(option: PlayerInputModel): number {
  if (option.type === 'colony') {
    return option.coloniesModel.length;
  }
  return option.type === 'or' || option.type === 'and' ? Math.max(0, ...option.options.map(colonyChoices)) : 0;
}

function isDisplayed(option: PlayerInputModel): boolean {
  return !(option.type === 'card' && option.showOnlyInLearnerMode !== false && !getPreferences().learner_mode);
}

/**
 * The player's main menu of actions: a grid of tiles, one per option. Choosing one opens it on its own,
 * with a way back. Replaces the radio list for the top-level choice in the operations panel.
 */
export default defineComponent({
  name: 'ActionMenu',
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => OrOptionsModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: OrOptionsResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  components: {
    AppButton,
  },
  inject: {
    parentCompactTiles: {
      from: 'compactTiles',
      default: () => () => false,
    },
  },
  provide() {
    return {
      compactTiles: () => !this.detailInModal && (this.parentCompactTiles as () => boolean)(),
    };
  },
  data() {
    return {
      openIdx: undefined as number | undefined,
      // Remounts the open input when it is reopened.
      openKey: 0,
      /** The card being played from the hand: the option it belongs to, narrowed to that card. */
      quickPlay: undefined as {idx: number, input: PlayerInputModel} | undefined,
      /** Whether the quick play dialog can attach to the game page (it cannot in isolated tests). */
      hasHome: false,
    };
  },
  computed: {
    entries(): Array<Entry> {
      return this.playerinput.options
        .map((option, idx) => ({option, idx}))
        .filter(({option}) => isDisplayed(option))
        .map(({option, idx}) => {
          const kind = actionKind(option);
          const {hint, muted} = this.describe(option);
          return {idx, option, kind, hint, muted, wide: kind === 'play'};
        });
    },
    /* The actions other than ending the turn. Turmoil's policy action sits beside sending a delegate. */
    mainEntries(): Array<Entry> {
      const main = this.entries.filter((e) => !END_KINDS.includes(e.kind));
      const policy = main.find((e) => e.kind === 'policy');
      const delegate = main.findIndex((e) => e.kind === 'delegate');
      if (policy === undefined || delegate < 0) {
        return main;
      }
      const rest = main.filter((e) => e !== policy);
      rest.splice(rest.findIndex((e) => e.kind === 'delegate'), 0, policy);
      return rest;
    },
    endEntries(): Array<Entry> {
      return this.entries.filter((e) => END_KINDS.includes(e.kind));
    },
    openOption(): PlayerInputModel | undefined {
      if (this.openIdx !== undefined) {
        return this.playerinput.options[this.openIdx];
      }
      // With a single choice, there is nothing to pick from.
      return this.entries.length === 1 ? this.entries[0].option : undefined;
    },
    requestedCard(): CardName | undefined {
      return quickActions.card;
    },
    /* True when the open action is a list of cards, colony tiles or parties: it shows in a large dialog, where they are readable. */
    detailInModal(): boolean {
      const option = this.openOption;
      return this.hasHome && this.openIdx !== undefined && option !== undefined &&
        (option.type === 'card' || option.type === 'projectCard' || needsColonies(option) || needsParties(option));
    },
    requestedAction(): CardName | undefined {
      return quickActions.actionCard;
    },
    /* True when this is the end-of-generation choice of which global parameter the World Government raises. */
    worldGovernment(): boolean {
      // Isolated tests mount the menu without a game.
      return this.playerView.game?.phase === Phase.SOLAR;
    },
  },
  watch: {
    requestedCard(card: CardName | undefined) {
      if (card !== undefined) {
        takeRequestedCard();
        this.openQuickPlay(card);
      }
    },
    requestedAction(card: CardName | undefined) {
      if (card !== undefined) {
        takeRequestedAction();
        this.useCardAction(card);
      }
    },
  },
  mounted() {
    this.hasHome = document.getElementById('player-home') !== null;
    window.addEventListener('keydown', this.onKeydown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeydown);
    quickActions.highlight = false;
    quickActions.focusActions = false;
  },
  methods: {
    describe(option: PlayerInputModel): {hint: string | undefined, muted: boolean} {
      if (this.worldGovernment) {
        return {hint: this.worldGovernmentHint(option), muted: false};
      }
      if (option.type === 'projectCard' || option.type === 'card') {
        const available = option.cards.filter((c) => c.isDisabled !== true).length;
        const label = actionKind(option) === 'play' ? 'playable' : 'available';
        return {hint: available + ' ' + this.$t(label), muted: available === 0};
      }
      if (needsColonies(option)) {
        return {hint: this.colonyHint(option), muted: false};
      }
      if (option.type === 'or') {
        return {hint: option.options.length + ' ' + this.$t('choices'), muted: false};
      }
      if (actionKind(option) === 'policy') {
        return {hint: this.$t('Ruling policy'), muted: false};
      }
      if (option.type === 'party') {
        return {hint: this.delegateHint(), muted: false};
      }
      return {hint: undefined, muted: false};
    },
    /* The step a World Government option takes, from the current value to the next, e.g. "14% → 16%". */
    worldGovernmentHint(option: PlayerInputModel): string | undefined {
      const game = this.playerView.game;
      const title = typeof option.title === 'string' ? option.title : option.title.message;
      const max = getGlobalParameterMaximums(game.gameOptions.boardName);
      const temperature = (t: number) => (t > 0 ? '+' + t : t.toString()) + '°';
      switch (title) {
      case 'Increase temperature':
        return temperature(game.temperature) + ' → ' + temperature(game.temperature + 2);
      case 'Increase oxygen':
        return game.oxygenLevel + '% → ' + (game.oxygenLevel + 1) + '%';
      case 'Add an ocean':
        return game.oceans + '/' + max.oceans + ' → ' + (game.oceans + 1) + '/' + max.oceans;
      case 'Increase Venus scale':
        return game.venusScaleLevel + '% → ' + (game.venusScaleLevel + (game.venusScaleLevel < MAX_VENUS_SCALE ? 2 : 1)) + '%';
      default:
        return undefined;
      }
    },
    /* The number of colony tiles `option` offers, and for trading, the fleets this player has free. */
    colonyHint(option: PlayerInputModel): string {
      const tiles = colonyChoices(option);
      const player = this.playerView.thisPlayer;
      const hint = tiles + ' ' + this.$t('colonies');
      if (actionKind(option) !== 'trade' || player === undefined) {
        return hint;
      }
      return hint + ' · ' + (player.fleetSize - player.tradesThisGeneration) + ' ' + this.$t('fleets free');
    },
    /* The delegates this player has left to send, in reserve and in the lobby. */
    delegateHint(): string | undefined {
      const turmoil = this.playerView.game?.turmoil;
      const color = this.playerView.thisPlayer?.color;
      if (turmoil === undefined || color === undefined) {
        return undefined;
      }
      const reserve = turmoil.reserve.find((r) => r.color === color)?.number ?? 0;
      return reserve + ' ' + this.$t('in reserve') + (turmoil.lobby.includes(color) ? ' · 1 ' + this.$t('in the lobby') : '');
    },
    kindOf(option: PlayerInputModel): ActionKind {
      return actionKind(option);
    },
    iconPath(kind: ActionKind): string {
      return ICONS[kind];
    },
    isPicking(kind: ActionKind): boolean {
      return kind === 'play' ? quickActions.highlight : kind === 'card-action' && quickActions.focusActions;
    },
    choose(entry: Entry): void {
      // Cards are played from the hand, and their actions used from the tableau: these just point there.
      if (entry.kind === 'play') {
        quickActions.focusActions = false;
        quickActions.highlight = !quickActions.highlight;
        return;
      }
      if (entry.kind === 'card-action' && entry.option.type === 'card') {
        quickActions.highlight = false;
        quickActions.focusActions = !quickActions.focusActions;
        return;
      }
      quickActions.highlight = false;
      quickActions.focusActions = false;
      this.open(entry.idx);
    },
    /* Uses the action of the played card `card`, if this menu offers it. */
    useCardAction(card: CardName): void {
      const idx = this.playerinput.options.findIndex((o) => o.type === 'card' && actionKind(o) === 'card-action' && o.cards.some((c) => c.name === card && c.isDisabled !== true));
      if (idx < 0) {
        return;
      }
      quickActions.focusActions = false;
      quickActions.followUp = true;
      this.onsave({type: 'or', index: idx, response: {type: 'card', cards: [card]}});
    },
    open(idx: number): void {
      this.openIdx = idx;
      this.openKey++;
    },
    /* Opens the quick play dialog for `card`, if an option here can play it. */
    openQuickPlay(card: CardName): void {
      const idx = this.playerinput.options.findIndex((o) => o.type === 'projectCard' && o.cards.some((c) => c.name === card && c.isDisabled !== true));
      const option = this.playerinput.options[idx];
      if (option?.type !== 'projectCard') {
        return;
      }
      quickActions.highlight = false;
      this.quickPlay = {idx, input: {...option, cards: option.cards.filter((c) => c.name === card)}};
    },
    closeQuickPlay(): void {
      this.quickPlay = undefined;
    },
    quickSaved(out: InputResponse): void {
      if (this.quickPlay !== undefined) {
        quickActions.followUp = true;
        this.onsave({type: 'or', index: this.quickPlay.idx, response: out});
      }
    },
    saveQuickPlay(): void {
      (this.$refs.quickfactory as {saveData: () => void}).saveData();
    },
    onKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') {
        return;
      }
      if (this.quickPlay !== undefined) {
        this.closeQuickPlay();
      } else if (this.detailInModal) {
        this.close();
      } else {
        quickActions.highlight = false;
        quickActions.focusActions = false;
      }
    },
    close(): void {
      this.openIdx = undefined;
    },
    // A multi-select card list renders its own button so it can label it (e.g. "Sell 3 patents").
    childSavesItself(option: PlayerInputModel): boolean {
      return option.type === 'card' && !(option.max === 1 && option.min === 1);
    },
    saved(out: InputResponse): void {
      const option = this.openOption;
      if (option === undefined) {
        return;
      }
      // What the action asks next shows in a dialog too.
      if (this.detailInModal) {
        quickActions.followUp = true;
      }
      this.onsave({type: 'or', index: this.playerinput.options.indexOf(option), response: out});
    },
    saveData(): void {
      (this.$refs.inputfactory as {saveData: () => void}).saveData();
    },
  },
});
</script>
