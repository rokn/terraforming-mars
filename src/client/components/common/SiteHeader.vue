<!-- Site header for the pages outside a game: logo, wordmark and the main navigation. -->
<template>
  <header class="tm-site-header">
    <a class="tm-site-brand" href=".">
      <svg class="tm-logo" width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" fill="#D9532B" />
        <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" fill="none" stroke="#F1E2C8" stroke-width="1.6" />
        <circle cx="18" cy="18" r="3.4" fill="#F1E2C8" />
      </svg>
      <span class="tm-site-wordmark" v-i18n>Terraforming Mars</span>
    </a>
    <nav class="tm-site-nav" :aria-label="$t('Main')">
      <a v-for="link in LINKS" :key="link.key"
        :class="['tm-site-nav-link', {'tm-site-nav-link--active': link.key === active}]"
        :href="link.href"
        :target="link.target"
        :aria-current="link.key === active ? 'page' : undefined"
        :data-test="'nav-' + link.key"
        v-i18n>{{ link.label }}</a>
    </nav>
    <div v-if="$slots.default" class="tm-site-header-extra">
      <slot></slot>
    </div>
  </header>
</template>

<script setup lang="ts">
import {paths} from '@/common/app/paths';

/* A page reachable from the site header. */
export type SiteHeaderLink = 'home' | 'new-game' | 'cards';

defineProps<{
  /** The page being shown, highlighted in the navigation. */
  active?: SiteHeaderLink;
}>();

const LINKS: ReadonlyArray<{key: SiteHeaderLink, href: string, label: string, target?: string}> = [
  {key: 'home', href: '.', label: 'Home'},
  {key: 'new-game', href: paths.NEW_GAME, label: 'New game'},
  {key: 'cards', href: paths.CARDS, label: 'Cards list', target: '_blank'},
];
</script>
