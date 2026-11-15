<template>
  <section class="tm-standings" :aria-label="$t('Final standings')">
    <div class="tm-standings-hero">
      <svg width="200" height="200" viewBox="0 0 220 220" aria-hidden="true" class="tm-standings-planet">
        <defs>
          <radialGradient id="tmStandingsPlanet" cx="40%" cy="35%" r="70%">
            <stop offset="0" stop-color="#C9602F" />
            <stop offset="0.6" stop-color="#8E3519" />
            <stop offset="1" stop-color="#3A1409" />
          </radialGradient>
          <filter id="tmStandingsSea" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="4" seed="21" />
            <feColorMatrix type="matrix" :values="seaMatrix" />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>
        </defs>
        <circle cx="110" cy="110" r="104" class="tm-standings-glow" />
        <circle cx="110" cy="110" r="96" fill="url(#tmStandingsPlanet)" />
        <circle cx="110" cy="110" r="96" fill="#fff" filter="url(#tmStandingsSea)" />
        <circle cx="110" cy="110" r="101" class="tm-standings-ring" />
      </svg>
      <div class="tm-standings-headline">
        <span class="tm-section-caption tm-standings-globals">
          <span v-i18n>Temp</span> {{ temperatureText }}°C · O₂ {{ game.oxygenLevel }}% · <span v-i18n>Oceans</span> {{ game.oceans }}/{{ maximums.oceans }} · <template v-if="game.gameOptions.expansions.venus"><span v-i18n>Venus</span> <span data-test="venus">{{ game.venusScaleLevel }}%</span> · </template><span v-i18n>Generation</span> {{ game.generation }}
        </span>
        <h1 class="tm-standings-title" v-i18n>{{ game.isTerraformed ? 'Mars is habitable' : 'Game over' }}</h1>
        <div v-if="winners.length > 0" class="tm-standings-winner" data-test="winner">
          <PlayerCube :color="winners[0].color" :size="34" />
          <span class="tm-standings-winner-name">{{ winnerText }} <span v-i18n>wins</span></span>
          <span class="tm-standings-vp">{{ winners[0].victoryPointsBreakdown.total }} VP</span>
          <span v-if="margin !== undefined" class="tm-section-caption">{{ margin }} <span v-i18n>ahead</span></span>
        </div>
      </div>
    </div>

    <div class="tm-standings-head">
      <h2 class="tm-section-title" v-i18n>Final standings</h2>
      <div class="tm-standings-legend">
        <span v-for="cat in categories" :key="cat.key"><span class="tm-standings-swatch" :style="{background: cat.color}"></span><span v-i18n>{{ cat.label }}</span></span>
      </div>
    </div>
    <div class="tm-standings-columns" aria-hidden="true">
      <span></span>
      <span class="tm-standings-cells">
        <span v-for="cat in categories" :key="cat.key" class="tm-standings-cell" :title="$t(cat.label)">{{ cat.short }}</span>
      </span>
      <span class="tm-standings-cell tm-standings-cell--total" v-i18n>VP</span>
    </div>
    <div v-for="(p, idx) in players" :key="p.color" class="tm-standings-row" :class="{'tm-standings-row--first': idx === 0}" data-test="standing">
      <span class="tm-standings-rank">{{ idx + 1 }}</span>
      <PlayerCube :color="p.color" :size="24" />
      <span class="tm-standings-names">
        <span class="tm-standings-corp" v-i18n>{{ corporationName(p) }}</span>
        <a class="tm-standings-player" :href="'player?id=' + p.id + '&noredirect'">{{ p.name }}</a>
        <span class="tm-standings-extra" data-test="extra">
          {{ p.megacredits }} M€<template v-if="game.gameOptions.showTimers"> · {{ timer(p) }}</template> · {{ p.actionsTakenThisGame }} <span v-i18n>actions</span>
        </span>
      </span>
      <span class="tm-standings-bar" aria-hidden="true">
        <template v-for="cat in categories" :key="cat.key">
          <span v-if="cat.value(p) > 0" class="tm-standings-seg" :style="{flexBasis: (100 * cat.value(p) / scale) + '%', background: cat.color}" :title="$t(cat.label) + ': ' + cat.value(p)"></span>
        </template>
      </span>
      <span class="tm-standings-cells">
        <span v-for="cat in categories" :key="cat.key" class="tm-standings-cell" :class="{'tm-standings-cell--zero': cat.value(p) === 0}" :title="$t(cat.label)" data-test="cell">{{ cat.value(p) }}</span>
      </span>
      <span class="tm-standings-total" data-test="total">{{ p.victoryPointsBreakdown.total }}</span>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {GlobalParameterMaximums, getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {Timer} from '@/common/Timer';

/** One victory point category drawn as a bar segment. */
type Category = {key: string, label: string, short: string, color: string, value: (p: PublicPlayerModel) => number};

const CATEGORIES: ReadonlyArray<Category> = [
  {key: 'tr', label: 'TR', short: 'TR', color: '#F1E2C8', value: (p) => p.victoryPointsBreakdown.terraformRating},
  {key: 'milestones', label: 'Milestones', short: 'M', color: '#F2B33D', value: (p) => p.victoryPointsBreakdown.milestones},
  {key: 'awards', label: 'Awards', short: 'A', color: '#D9532B', value: (p) => p.victoryPointsBreakdown.awards},
  {key: 'greenery', label: 'Greenery', short: 'GRN', color: '#4A8A42', value: (p) => p.victoryPointsBreakdown.greenery},
  {key: 'city', label: 'Cities', short: 'CTY', color: '#8A8E96', value: (p) => p.victoryPointsBreakdown.city},
  {key: 'cards', label: 'Cards', short: 'CRD', color: '#3E7BC7', value: (p) => p.victoryPointsBreakdown.victoryPoints},
];
// Categories that only some games score.
const MOON_CATEGORIES: ReadonlyArray<Category> = [
  {key: 'moonRoads', label: 'Moon roads', short: 'RD', color: '#6E6A78', value: (p) => p.victoryPointsBreakdown.moonRoads},
  {key: 'moonHabitats', label: 'Moon habitats', short: 'HAB', color: '#9A94A8', value: (p) => p.victoryPointsBreakdown.moonHabitats},
  {key: 'moonMines', label: 'Moon mines', short: 'MIN', color: '#56525E', value: (p) => p.victoryPointsBreakdown.moonMines},
];
const PLANETARY_TRACKS: Category = {key: 'tracks', label: 'Planetary tracks', short: 'PT', color: '#7ED3C4', value: (p) => p.victoryPointsBreakdown.planetaryTracks};
const ESCAPE_VELOCITY: Category = {key: 'escape', label: 'Escape Velocity penalty', short: 'EV', color: '#C04040', value: (p) => p.victoryPointsBreakdown.escapeVelocity};

export default defineComponent({
  name: 'FinalStandings',
  props: {
    game: {
      type: Object as () => GameModel,
      required: true,
    },
    /* Players from first place to last. */
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    winners: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  components: {
    PlayerCube,
  },
  computed: {
    categories(): ReadonlyArray<Category> {
      const categories = [...CATEGORIES];
      if (this.game.moon !== undefined) {
        categories.push(...MOON_CATEGORIES);
      }
      if (this.game.pathfinders !== undefined) {
        categories.push(PLANETARY_TRACKS);
      }
      if (this.game.gameOptions.escapeVelocity !== undefined) {
        categories.push(ESCAPE_VELOCITY);
      }
      return categories;
    },
    maximums(): Readonly<GlobalParameterMaximums> {
      return getGlobalParameterMaximums(this.game.gameOptions.boardName);
    },
    seaMatrix(): string {
      // Oceans show through in proportion to how many were placed.
      const coverage = this.game.oceans / this.maximums.oceans;
      const bias = (-1.6 + 0.6 * coverage).toFixed(2);
      return `0 0 0 0 0.17  0 0 0 0 0.39  0 0 0 0 0.66  2.4 0 0 0 ${bias}`;
    },
    temperatureText(): string {
      const t = this.game.temperature;
      return t > 0 ? '+' + t : t.toString();
    },
    /* Bar length that the largest total fills, rounded up so bars never touch the edge. */
    scale(): number {
      const top = Math.max(1, ...this.players.map((p) => this.categories.reduce((sum, c) => sum + Math.max(0, c.value(p)), 0)));
      return Math.ceil(top * 1.05);
    },
    winnerText(): string {
      return this.winners.map((p) => this.corporationName(p)).join(' & ');
    },
    margin(): number | undefined {
      if (this.winners.length !== 1 || this.players.length < 2) {
        return undefined;
      }
      return this.players[0].victoryPointsBreakdown.total - this.players[1].victoryPointsBreakdown.total;
    },
  },
  methods: {
    timer(p: PublicPlayerModel): string {
      return Timer.toString(p.timer);
    },
    corporationName(p: PublicPlayerModel): string {
      const corp = p.tableau.find((card) => getCard(card.name)?.type === CardType.CORPORATION);
      return corp?.name ?? p.name;
    },
  },
});
</script>
