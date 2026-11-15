<template>
  <div id="game-home" class="game-home-container tm-lobby">
    <SiteHeader />

    <div class="tm-lobby-page">
      <div class="tm-lobby-title">
        <div class="tm-lobby-title-text">
          <span class="tm-create-step" v-i18n>Step 2 of 2 · Invite</span>
          <h1 class="tm-create-h1">{{ titleParts[0] }}<span class="tm-lobby-id">{{ gameId }}</span>{{ titleParts[1] }}</h1>
          <p class="tm-create-lede">
            <span v-i18n>Instructions: To start the game, separately copy and share the links with all players, and then click on your name.</span>
            &#32;<span v-i18n>Save this page in case you or one of your opponents loses a link.</span>
          </p>
        </div>
        <svg class="tm-lobby-planet" width="200" height="140" viewBox="0 0 200 140" aria-hidden="true">
          <defs>
            <radialGradient id="tmLobbyPlanet" cx="40%" cy="35%" r="70%">
              <stop offset="0" stop-color="#C9602F" />
              <stop offset="0.6" stop-color="#8E3519" />
              <stop offset="1" stop-color="#3A1409" />
            </radialGradient>
            <filter id="tmLobbyTerrain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="3" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.07  0 0 0 0 0.03  1.6 0 0 0 -0.62" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <ellipse cx="100" cy="70" rx="96" ry="26" fill="none" stroke="#F1E2C8" stroke-opacity="0.25" stroke-dasharray="3 4" transform="rotate(-12 100 70)" />
          <circle cx="100" cy="70" r="52" fill="url(#tmLobbyPlanet)" />
          <circle cx="100" cy="70" r="52" fill="#fff" filter="url(#tmLobbyTerrain)" />
          <rect x="178" y="44" width="10" height="10" fill="#FF7A3D" transform="rotate(20 183 49)" />
        </svg>
      </div>

      <div class="tm-lobby-layout">
        <section class="tm-lobby-seats" :aria-label="$t('Players')">
          <h2 class="tm-section-title tm-section-title--large">
            <span v-i18n>Seats</span>
            <span class="tm-section-caption">{{ players.length }} · <span v-i18n>Players</span></span>
          </h2>
          <div v-for="(player, index) in players" :key="player.color" class="tm-seat" :data-color="player.color">
            <PlayerCube :color="player.color" :size="26" />
            <div class="tm-seat-who">
              <span class="tm-seat-name player-name"><a :href="getHref(player.id)">{{ player.name }}</a></span>
              <span class="tm-seat-state turn-order" v-i18n>{{ getTurnOrder(index) }}</span>
            </div>
            <label class="tm-seat-link">
              <span class="tm-visually-hidden">{{ player.name }}</span>
              <input type="text" readonly :value="getUrl(player.id)" @focus="selectAll">
            </label>
            <AppButton class="tm-seat-copy" title="copy" size="tiny" @click="copyUrl(player.id)" />
            <span v-if="isPlayerUrlCopied(player.id)" class="copied-notice"><span v-i18n>Copied!</span></span>
            <a class="tm-button tm-button--secondary tm-seat-open" :href="getHref(player.id)"><span v-i18n>Open</span>&nbsp;→</a>
          </div>

          <div class="tm-seat tm-seat--spectator">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            <div class="tm-seat-who">
              <span class="tm-seat-name player-name"><a :href="getHref(game.spectatorId)" v-i18n>Spectator</a></span>
              <span class="tm-seat-state" v-i18n>Read-only, no hands shown</span>
            </div>
            <label class="tm-seat-link">
              <span class="tm-visually-hidden" v-i18n>Spectator</span>
              <input type="text" readonly :value="getUrl(game.spectatorId)" @focus="selectAll">
            </label>
            <AppButton class="tm-seat-copy" title="copy" size="tiny" @click="copyUrl(game.spectatorId)" />
            <span v-if="isPlayerUrlCopied(game.spectatorId)" class="copied-notice"><span v-i18n>Copied!</span></span>
          </div>

          <PurgeWarning :expectedPurgeTimeMs="game.expectedPurgeTimeMs" />
        </section>

        <aside class="tm-lobby-aside" :aria-label="$t('Game settings')">
          <div class="tm-panel">
            <div class="tm-panel-inner tm-lobby-share">
              <h2 class="tm-section-title--large" v-i18n>Share all</h2>
              <p v-i18n>Copies one message with every player's name and link, ready to paste into your group chat.</p>
              <button type="button" class="tm-lobby-copy-all" data-test="copy-invite" @click="copyInviteMessage">
                <span v-if="inviteCopied" v-i18n>Copied!</span>
                <span v-else v-i18n>Copy invite message</span>
              </button>
              <div class="tm-lobby-details">
                <div class="tm-manifest-row">
                  <span class="tm-manifest-key" v-i18n>Region</span>
                  <strong class="capitalized" v-i18n>{{ game.gameOptions.boardName }}</strong>
                </div>
                <div class="tm-manifest-row">
                  <span class="tm-manifest-key" v-i18n>Modules</span>
                  <strong>{{ moduleNames }}</strong>
                </div>
                <div class="tm-manifest-row">
                  <span class="tm-manifest-key" v-i18n>Players</span>
                  <strong>{{ players.length }}</strong>
                </div>
              </div>
              <details class="tm-advanced tm-lobby-settings">
                <summary class="tm-advanced-summary" v-i18n>Game settings</summary>
                <div class="tm-advanced-body">
                  <GameSetupDetail :gameOptions="game.gameOptions" :playerNumber="players.length" :lastSoloGeneration="game.lastSoloGeneration" />
                </div>
              </details>
            </div>
          </div>
          <div class="tm-hint">
            <span class="tm-hint-stripe"></span>
            <span class="tm-hint-text" v-i18n>Links are the only way in. Anyone with a link can play that seat, so send them privately.</span>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import AppButton from '@/client/components/common/AppButton.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import SiteHeader from '@/client/components/common/SiteHeader.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {EXPANSIONS, MODULE_NAMES} from '@/common/cards/GameModule';
import GameSetupDetail from '@/client/components/GameSetupDetail.vue';
import {ParticipantId} from '@/common/Types';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {setDocumentTitle} from '../utils/documentTitle';

// taken from https://stackoverflow.com/a/46215202/83336
// The solution to copying to the clipboard in this case is
// 1. create a dummy textarea (it keeps line breaks, unlike an input)
// 2. add the copied text as a value
// 3. select the textarea
// 4. execute document.execCommand('copy') which does the clipboard thing
// 5. remove the dummy textarea
function copyToClipboard(text: string): void {
  const input = document.createElement('textarea');
  input.value = text;
  document.body.appendChild(input);
  input.select();
  document.execCommand('copy');
  document.body.removeChild(input);
}
const DEFAULT_COPIED_PLAYER_ID = '-1';

export default defineComponent({
  name: 'GameHome',
  props: {
    game: {
      type: Object as () => SimpleGameModel,
      required: true,
    },
  },
  components: {
    AppButton,
    PlayerCube,
    SiteHeader,
    GameSetupDetail,
    PurgeWarning,
  },

  data() {
    return {
      // Variable to keep the state for the current copied player id. Used to display message of which button and which player playable link is currently in the clipboard
      urlCopiedPlayerId: DEFAULT_COPIED_PLAYER_ID,
      /** True for a few seconds after the invite message is copied. */
      inviteCopied: false,
      previousViewport: '',
    };
  },
  computed: {
    gameId(): string {
      return this.game !== undefined ? this.game.id.toString() : 'n/a';
    },
    /** The translated title around the game id, which is shown in its own style. */
    titleParts(): [string, string] {
      const [before, after] = translateTextWithParams('Game ${0} is live', ['\u0000']).split('\u0000');
      return [before ?? '', after ?? ''];
    },
    players(): SimpleGameModel['players'] {
      return this.game?.players ?? [];
    },
    /** The game's expansions, by name. */
    moduleNames(): string {
      const names = EXPANSIONS.filter((e) => this.game.gameOptions.expansions[e]).map((e) => translateText(MODULE_NAMES[e]));
      return [translateText(MODULE_NAMES.base), ...names].join(' · ');
    },
  },
  methods: {
    getTurnOrder(index: number): string {
      if (index === 0) {
        return '1st';
      } else if (index === 1) {
        return '2nd';
      } else if (index === 2) {
        return '3rd';
      } else if (index > 2) {
        return `${index + 1}th`;
      } else {
        return 'n/a';
      }
    },
    setCopiedIdToDefault() {
      this.urlCopiedPlayerId = DEFAULT_COPIED_PLAYER_ID;
      this.inviteCopied = false;
    },
    getHref(playerId: ParticipantId): string {
      if (playerId === this.game.spectatorId) {
        return `spectator?id=${playerId}`;
      }
      return `player?id=${playerId}`;
    },
    /* The full link for `playerId`, on this server. */
    getUrl(playerId: ParticipantId): string {
      // Get current location path without game?id=xxxxxxx
      const path = window.location.href.replace(/game\?id=.*/, '');
      return path + this.getHref(playerId);
    },
    copyUrl(playerId: ParticipantId | undefined): void {
      if (playerId === undefined) {
        return;
      }
      copyToClipboard(this.getUrl(playerId));
      this.urlCopiedPlayerId = playerId;
    },
    /* The text of the invite message: every player's name and link, then the spectator link. */
    inviteMessage(): string {
      const lines = this.players.map((player) => `${player.name}: ${this.getUrl(player.id)}`);
      lines.push(`${translateText('Spectator')}: ${this.getUrl(this.game.spectatorId)}`);
      return lines.join('\n');
    },
    copyInviteMessage(): void {
      copyToClipboard(this.inviteMessage());
      this.inviteCopied = true;
    },
    selectAll(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },
    isPlayerUrlCopied(playerId: string): boolean {
      return playerId === this.urlCopiedPlayerId;
    },
  },
  mounted() {
    // Reset the copied player id after 3 seconds to hide the "copied" message
    setInterval(this.setCopiedIdToDefault, 3000);
    setDocumentTitle(this.game.name);
    // Set the viewport width to width=device-width on the create game form so mobile browsers use their actual CSS viewport width.
    // The current global viewport is width=1260, which prevents the create game form from using the device width on phones.
    // This is a temporary solution in order to make this edit scoped to the create game form.
    // TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport !== null) {
      this.previousViewport = viewport.getAttribute('content') ?? '';
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, viewport-fit=cover',
      );
    }
  },
  beforeUnmount() {
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute('content', this.previousViewport);
  },
});

</script>
