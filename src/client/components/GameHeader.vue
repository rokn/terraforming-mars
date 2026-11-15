<template>
  <header class="tm-header">
    <div class="tm-header-brand">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" class="tm-header-logo-hex" />
        <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" class="tm-header-logo-ring" />
        <circle cx="18" cy="18" r="3.4" class="tm-header-logo-dot" />
      </svg>
      <div class="tm-header-title">
        <span class="tm-header-name">Terraforming Mars</span>
        <span class="tm-header-meta" data-test="meta">
          <span>{{ playerCount }}</span> <span v-i18n>players</span> · <span v-i18n>{{ boardLabel }}</span>
        </span>
      </div>
    </div>

    <div class="tm-header-center">
      <div class="tm-header-gen">
        <span class="tm-header-gen-label" v-i18n>GEN</span>
        <span class="tm-header-gen-digits" :aria-label="$t('Generation') + ' ' + game.generation" data-test="generation">
          <span v-for="(digit, idx) in generationDigits" :key="idx" class="tm-header-gen-digit">{{ digit }}</span>
        </span>
      </div>
      <nav v-if="step !== undefined" class="tm-header-phases" :aria-label="$t('Generation phases')">
        <span v-for="s in steps" :key="s.id"
          class="tm-header-phase"
          :class="{'tm-header-phase--current': s.id === step}"
          :aria-current="s.id === step ? 'step' : undefined"
          data-test="phase"
          v-i18n>{{ s.label }}</span>
      </nav>
      <span v-else class="tm-header-over" v-i18n>Game over</span>
      <div class="tm-header-progress">
        <span class="tm-header-progress-label"><span v-i18n>Terraformed</span><strong data-test="terraformed">{{ terraformed }}%</strong></span>
        <span class="tm-header-progress-track"><span class="tm-header-progress-fill" :style="{width: terraformed + '%'}"></span></span>
      </div>
      <span v-if="game.turmoil?.ruling !== undefined" class="tm-header-ruling" :title="$t('Ruling party')" data-test="ruling">
        <span class="tm-header-ruling-label" v-i18n>Ruling</span>
        <PartyChip :party="game.turmoil.ruling" />
      </span>
    </div>

    <div class="tm-header-tools">
      <span v-if="isActing" class="tm-header-turn" data-test="your-turn">
        <span class="tm-header-turn-stripe"></span>
        <span class="tm-header-turn-text" v-i18n>Your turn</span>
      </span>
      <span v-else-if="step !== undefined" class="tm-header-waiting" v-i18n>Waiting</span>
      <span v-if="game.gameOptions.showTimers" class="tm-header-clock" :title="$t('Your time')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2M9 2h6" /></svg>
        <PlayerTimer :timer="playerView.thisPlayer.timer" :live="game.phase !== 'end'" />
      </span>
      <button type="button" class="tm-header-tool" :title="$t('Game log')" :aria-label="$t('Game log')" data-test="open-log" @click="$emit('openLog')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1" /></svg>
      </button>
      <a href="help" target="_blank" rel="noopener" class="tm-header-tool" :title="$t('player aid')" :aria-label="$t('player aid')">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" aria-hidden="true"><path d="M9 9a3 3 0 1 1 4 2.8c-.6.3-1 .9-1 1.6V15M12 18v1" /><rect x="3" y="3" width="18" height="18" /></svg>
      </a>
      <LanguageIcon class="tm-header-icon" />
      <PreferencesIcon class="tm-header-icon" />
    </div>
    <TerraformedBanner v-if="game.isTerraformed" :playerId="playerView.id" />
  </header>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {GameModel} from '@/common/models/GameModel';
import PlayerTimer from '@/client/components/overview/PlayerTimer.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import TerraformedBanner from '@/client/components/TerraformedBanner.vue';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import {PhaseStep, phaseStep, terraformedPercent} from '@/client/utils/gameTheme';

const STEPS: ReadonlyArray<{id: PhaseStep, label: string}> = [
  {id: 'research', label: 'Research'},
  {id: 'action', label: 'Action'},
  {id: 'production', label: 'Production'},
];

export default defineComponent({
  name: 'GameHeader',
  emits: ['openLog'],
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
  },
  components: {
    PlayerTimer,
    LanguageIcon,
    PreferencesIcon,
    TerraformedBanner,
    PartyChip,
  },
  computed: {
    game(): GameModel {
      return this.playerView.game;
    },
    steps(): typeof STEPS {
      return STEPS;
    },
    step(): PhaseStep | undefined {
      return phaseStep(this.game.phase);
    },
    playerCount(): number {
      return this.playerView.players.length;
    },
    boardLabel(): string {
      return this.game.gameOptions.boardName.replaceAll('_', ' ');
    },
    generationDigits(): Array<string> {
      return this.game.generation.toString().padStart(2, '0').split('');
    },
    terraformed(): number {
      return terraformedPercent(this.game, this.game.gameOptions.boardName, this.game.gameOptions.expansions.venus);
    },
    isActing(): boolean {
      const waitingFor = this.playerView.waitingFor;
      return waitingFor !== undefined && !waitingFor.optional;
    },
  },
});
</script>
