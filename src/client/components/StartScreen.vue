<template>
  <div class="start-screen tm-home">
    <svg class="tm-home-grain" aria-hidden="true">
      <filter id="tmHomeGrain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /><feColorMatrix type="saturate" values="0" /></filter>
      <rect width="100%" height="100%" filter="url(#tmHomeGrain)" />
    </svg>

    <main class="tm-home-main">
      <section class="tm-home-hero" aria-labelledby="tm-home-title">
        <div class="tm-home-hero-text">
          <div class="tm-home-brand">
            <svg class="tm-logo" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
              <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#D9532B" />
              <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" fill="none" stroke="#F1E2C8" stroke-width="1.6" />
              <circle cx="18" cy="18" r="3.4" fill="#F1E2C8" />
            </svg>
            <span class="tm-home-kicker" v-i18n>Open source web edition</span>
          </div>
          <h1 id="tm-home-title" class="tm-home-title">
            <span class="start-screen-title-top" v-i18n>Terraforming</span>
            <span class="start-screen-title-bottom" v-i18n>Mars</span>
          </h1>
          <p class="tm-home-tagline" v-i18n>Raise the temperature, fill the oceans and grow the oxygen. Lead a corporation and make the red planet livable.</p>
          <a class="start-screen-link start-screen-link--new-game tm-home-new-game" href="new-game">
            <span v-i18n>New game</span>
            <span class="tm-home-arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <svg class="tm-home-planet" viewBox="0 0 200 140" aria-hidden="true">
          <defs>
            <radialGradient id="tmHomePlanet" cx="40%" cy="35%" r="70%">
              <stop offset="0" stop-color="#C9602F" />
              <stop offset="0.6" stop-color="#8E3519" />
              <stop offset="1" stop-color="#3A1409" />
            </radialGradient>
            <filter id="tmHomeTerrain" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="4" seed="3" />
              <feColorMatrix type="matrix" values="0 0 0 0 0.2  0 0 0 0 0.07  0 0 0 0 0.03  1.6 0 0 0 -0.62" />
              <feComposite in2="SourceGraphic" operator="in" />
            </filter>
          </defs>
          <ellipse cx="100" cy="70" rx="96" ry="26" fill="none" stroke="#F1E2C8" stroke-opacity="0.25" stroke-dasharray="3 4" transform="rotate(-12 100 70)" />
          <circle cx="100" cy="70" r="52" fill="url(#tmHomePlanet)" />
          <circle cx="100" cy="70" r="52" fill="#fff" filter="url(#tmHomeTerrain)" />
          <rect x="178" y="44" width="10" height="10" fill="#FF7A3D" transform="rotate(20 183 49)" />
        </svg>
      </section>

      <nav class="tm-home-tiles" :aria-label="$t('More')">
        <a v-for="tile in tiles" :key="tile.key"
          :class="['start-screen-link', 'start-screen-link--' + tile.key, 'tm-home-tile']"
          :href="tile.href"
          target="_blank">
          <svg class="tm-home-tile-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="square" aria-hidden="true">
            <path v-for="(d, i) in tile.icon" :key="i" :d="d" />
          </svg>
          <span class="tm-home-tile-text">
            <span class="tm-home-tile-name" v-i18n>{{ tile.name }}</span>
            <span class="tm-home-tile-desc" v-i18n>{{ tile.description }}</span>
          </span>
        </a>
      </nav>
    </main>

    <footer class="tm-home-footer">
      <div class="free-floating-preferences-icon">
        <LanguageIcon class="corner-language-icon" />
        <PreferencesIcon />
      </div>
      <div class="start-screen-link--languages">
        <LanguageSwitcher />
      </div>
      <div class="start-screen-version-cont">
        <span class="nowrap start-screen-date"><span v-i18n>deployed</span>: {{ raw_settings.builtAt }}</span>
        <span class="nowrap start-screen-version"><span v-i18n>version</span>: {{ raw_settings.head }}</span>
      </div>
      <div class="source-code">
        <a href="https://github.com/terraforming-mars/terraforming-mars" target="_blank" class="source-code-text">
          <img src="assets/misc/github.png" class="source-code-img" alt="">
          <span v-i18n>source code</span>
        </a>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import LanguageSwitcher from '@/client/components/LanguageSwitcher.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';

import raw_settings from '@/genfiles/settings.json';
import * as constants from '@/common/constants';

/* A secondary link on the start screen, drawn as a tile with an icon and a one-line description. */
type Tile = {
  key: string;
  href: string;
  name: string;
  description: string;
  /* Path data for a 24x24 line icon. */
  icon: ReadonlyArray<string>;
};

const tiles: ReadonlyArray<Tile> = [
  {
    key: 'how-to-play',
    href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks',
    name: 'How to Play',
    description: 'Rulebooks for the base game and every expansion',
    icon: ['M4 4h7a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H4z', 'M20 4h-7a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h7z'],
  },
  {
    key: 'cards-list',
    href: 'cards',
    name: 'Cards list',
    description: 'Browse and search every card in the game',
    icon: ['M8 3h12v16H8z', 'M4 7v14h12'],
  },
  {
    key: 'board-game',
    href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars',
    name: 'Board game',
    description: 'The original tabletop game on BoardGameGeek',
    icon: ['M12 2l9 5v10l-9 5-9-5V7z', 'M3 7l9 5 9-5', 'M12 12v10'],
  },
  {
    key: 'about',
    href: 'https://github.com/terraforming-mars/terraforming-mars#README',
    name: 'About us',
    description: 'The volunteer project behind this site',
    icon: ['M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18z', 'M12 11v6', 'M12 7v1'],
  },
  {
    key: 'changelog',
    href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Changelog',
    name: 'Whats new?',
    description: 'Recent changes, new cards and fixes',
    icon: ['M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4', 'M6 6l2.5 2.5', 'M15.5 15.5L18 18', 'M18 6l-2.5 2.5', 'M8.5 15.5L6 18'],
  },
  {
    key: 'chat',
    href: constants.DISCORD_INVITE,
    name: 'Join us on Discord',
    description: 'Find players, report bugs and chat',
    icon: ['M4 5h16v11H9l-5 4z', 'M9 10h1', 'M14 10h1'],
  },
];

const previousViewport = ref('');

// Set the viewport width to width=device-width on the start screen so mobile browsers use their actual CSS viewport width.
// The current global viewport is width=1260, which prevents the home page from using the device width on phones.
// This is a temporary solution in order to make this edit scoped to the start screen.
// TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
onMounted(() => {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport !== null) {
    previousViewport.value = viewport.getAttribute('content') ?? '';
    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1, viewport-fit=cover',
    );
  }
});

onBeforeUnmount(() => {
  document
    .querySelector('meta[name="viewport"]')
    ?.setAttribute('content', previousViewport.value);
});
</script>
