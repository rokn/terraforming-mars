<template>
  <svg class="mars-gauges" viewBox="0 0 670 620" width="670" height="620" role="img" :aria-label="ariaLabel">
    <defs>
      <radialGradient id="marsGaugesPlanet" cx="42%" cy="36%" r="70%">
        <stop offset="0" stop-color="#C9602F" />
        <stop offset="0.55" stop-color="#8E3519" />
        <stop offset="1" stop-color="#3A1409" />
      </radialGradient>
      <radialGradient id="marsGaugesLimb" cx="50%" cy="50%" r="50%">
        <stop offset="0.72" stop-color="#000" stop-opacity="0" />
        <stop offset="1" stop-color="#0B0503" stop-opacity="0.75" />
      </radialGradient>
      <filter id="marsGaugesTerrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.028" numOctaves="4" seed="11" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.20  0 0 0 0 0.07  0 0 0 0 0.03  1.6 0 0 0 -0.62" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="marsGaugesDust" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="3" seed="4" />
        <feColorMatrix type="matrix" values="0 0 0 0 0.93  0 0 0 0 0.66  0 0 0 0 0.45  0 1.4 0 0 -0.78" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
    </defs>

    <circle :cx="CX" :cy="CY" :r="R" fill="url(#marsGaugesPlanet)" />
    <circle :cx="CX" :cy="CY" :r="R" fill="#fff" filter="url(#marsGaugesTerrain)" />
    <circle :cx="CX" :cy="CY" :r="R" fill="#fff" filter="url(#marsGaugesDust)" />
    <circle :cx="CX" :cy="CY" :r="R" fill="url(#marsGaugesLimb)" />
    <circle :cx="CX" :cy="CY" :r="R + 7" fill="none" class="mars-gauges-halo" />

    <!-- Oxygen: one arc segment per percent across the top of the planet. -->
    <path v-for="seg in oxygenSegments" :key="'o' + seg.value" :d="seg.d"
      class="mars-gauges-oxygen" :class="{'mars-gauges-oxygen--on': seg.on}" data-test="oxygen-segment" />
    <g v-for="bonus in oxygenBonuses" :key="'ob' + bonus.value" :transform="`translate(${bonus.x}, ${bonus.y})`"
      class="mars-gauges-bonus" :class="['mars-gauges-bonus--' + bonus.kind, {'mars-gauges-bonus--done': oxygen >= bonus.value}]" data-test="bonus">
      <title>{{ bonus.title }}</title>
      <rect x="-10" y="-10" width="20" height="20" rx="4" class="mars-gauges-bonus-plate" />
      <path :d="bonusIcon(bonus.kind)" transform="scale(0.62) translate(-12, -12)" class="mars-gauges-bonus-icon" />
    </g>
    <text x="22" y="16" class="mars-gauges-label mars-gauges-label--oxygen">OXYGEN</text>
    <text x="22" y="42" class="mars-gauges-value" data-test="oxygen-value">{{ oxygen }}%</text>
    <text :x="oxygen >= 10 ? 76 : 62" y="42" class="mars-gauges-tick">of {{ maximums.oxygen }}%</text>

    <!-- Temperature: a thermometer on the right. -->
    <text :x="TX" y="92" text-anchor="middle" class="mars-gauges-label mars-gauges-label--temp">TEMP</text>
    <text :x="TX" y="118" text-anchor="middle" class="mars-gauges-value" data-test="temperature-value">{{ temperatureText(temperature) }}°</text>
    <rect :x="TX - 8" :y="T_TOP" width="16" :height="T_BOTTOM - T_TOP" rx="8" class="mars-gauges-tube" />
    <rect :x="TX - 4" :y="tempY(temperature)" width="8" :height="T_BOTTOM + 8 - tempY(temperature)" rx="4" class="mars-gauges-mercury" />
    <circle :cx="TX" :cy="T_BOTTOM + 16" r="14" class="mars-gauges-bulb" />
    <template v-for="tick in temperatureTicks" :key="'t' + tick">
      <line :x1="TX + 8" :x2="TX + 12" :y1="tempY(tick)" :y2="tempY(tick)" class="mars-gauges-tick-line" :class="{'mars-gauges-tick-line--reached': tick <= temperature}" />
      <text :x="TX + 15" :y="tempY(tick) + 3.5" class="mars-gauges-tick" :class="{'mars-gauges-tick--current': tick === temperature}" data-test="temperature-tick">{{ temperatureText(tick) }}</text>
    </template>
    <g v-for="bonus in temperatureBonuses" :key="'tb' + bonus.value" :transform="`translate(${TX - 24}, ${tempY(bonus.value)})`"
      class="mars-gauges-bonus" :class="['mars-gauges-bonus--' + bonus.kind, {'mars-gauges-bonus--done': temperature >= bonus.value}]" data-test="bonus">
      <title>{{ bonus.title }}</title>
      <rect x="-10" y="-10" width="20" height="20" rx="4" class="mars-gauges-bonus-plate" />
      <path :d="bonusIcon(bonus.kind)" transform="scale(0.62) translate(-12, -12)" class="mars-gauges-bonus-icon" />
    </g>

    <!-- Oceans: a counter and one pip per ocean. -->
    <text x="22" y="596" class="mars-gauges-label mars-gauges-label--ocean" data-test="oceans-value">OCEANS {{ oceans }}/{{ maximums.oceans }}</text>
    <polygon v-for="pip in oceanPips" :key="'p' + pip.index" :points="pip.points"
      class="mars-gauges-pip" :class="{'mars-gauges-pip--on': pip.on}" data-test="ocean-pip" />
  </svg>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {BoardName} from '@/common/boards/BoardName';
import {GlobalParameterMaximums, getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {
  MIN_OXYGEN_LEVEL,
  MIN_TEMPERATURE,
  OXYGEN_LEVEL_FOR_TEMPERATURE_BONUS,
  TEMPERATURE_BONUS_FOR_HEAT_1,
  TEMPERATURE_BONUS_FOR_HEAT_2,
  TEMPERATURE_FOR_OCEAN_BONUS,
} from '@/common/constants';

// Planet centre and radius, in the coordinates of `.board-cont`, chosen so the hex grid sits on the planet.
const CX = 330;
const CY = 308;
const R = 230;
// Oxygen arc radius and the angles (degrees, SVG orientation) it spans across the top of the planet.
const OXYGEN_R = 252;
const OXYGEN_START = 198;
const OXYGEN_END = 342;
// Thermometer column and its vertical extent.
const TX = 620;
const T_TOP = 140;
const T_BOTTOM = 486;

function polar(r: number, degrees: number): [number, number] {
  const rad = degrees * Math.PI / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
}

function arc(r: number, from: number, to: number): string {
  const [x1, y1] = polar(r, from);
  const [x2, y2] = polar(r, to);
  return `M${x1.toFixed(1)},${y1.toFixed(1)} A${r},${r} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)}`;
}

function hexPoints(cx: number, cy: number, r: number): string {
  return [0, 1, 2, 3, 4, 5]
    .map((i) => {
      const rad = (60 * i - 90) * Math.PI / 180;
      return `${(cx + r * Math.cos(rad)).toFixed(1)},${(cy + r * Math.sin(rad)).toFixed(1)}`;
    })
    .join(' ');
}

type BonusKind = 'heat' | 'ocean' | 'temp';
type Bonus = {value: number, title: string, kind: BonusKind};

// Icons (24×24) for what each bonus gives: heat production, an ocean, a temperature step.
const BONUS_ICONS: Record<BonusKind, string> = {
  heat: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 3 1-1-2 0-4 0-5z',
  ocean: 'M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z',
  temp: 'M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0zM12 9v8',
};

export default defineComponent({
  name: 'MarsGauges',
  props: {
    boardName: {
      type: String as () => BoardName,
      required: true,
    },
    temperature: {
      type: Number,
      required: true,
    },
    oxygen: {
      type: Number,
      required: true,
    },
    oceans: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {CX, CY, R, TX, T_TOP, T_BOTTOM};
  },
  computed: {
    maximums(): Readonly<GlobalParameterMaximums> {
      return getGlobalParameterMaximums(this.boardName);
    },
    oxygenSegments(): Array<{value: number, d: string, on: boolean}> {
      const count = this.maximums.oxygen - MIN_OXYGEN_LEVEL;
      const span = (OXYGEN_END - OXYGEN_START) / count;
      const gap = 1.2;
      return Array.from({length: count}, (_, i) => ({
        value: i + 1,
        d: arc(OXYGEN_R, OXYGEN_START + i * span + gap / 2, OXYGEN_START + (i + 1) * span - gap / 2),
        on: i < this.oxygen - MIN_OXYGEN_LEVEL,
      }));
    },
    oxygenBonuses(): Array<{value: number, x: number, y: number, title: string, kind: BonusKind}> {
      const count = this.maximums.oxygen - MIN_OXYGEN_LEVEL;
      const span = (OXYGEN_END - OXYGEN_START) / count;
      const value = OXYGEN_LEVEL_FOR_TEMPERATURE_BONUS;
      const [x, y] = polar(OXYGEN_R + 16, OXYGEN_START + (value - MIN_OXYGEN_LEVEL - 0.5) * span);
      return [{value, x, y, title: `${value}%: +1 temperature step`, kind: 'temp'}];
    },
    /* Every step of the temperature track (each step is 2°). */
    temperatureTicks(): Array<number> {
      const ticks = [];
      for (let t = MIN_TEMPERATURE; t <= this.maximums.temperature; t += 2) {
        ticks.push(t);
      }
      return ticks;
    },
    temperatureBonuses(): Array<Bonus> {
      return [
        {value: TEMPERATURE_BONUS_FOR_HEAT_1, title: `${TEMPERATURE_BONUS_FOR_HEAT_1}°: +1 heat production`, kind: 'heat'},
        {value: TEMPERATURE_BONUS_FOR_HEAT_2, title: `${TEMPERATURE_BONUS_FOR_HEAT_2}°: +1 heat production`, kind: 'heat'},
        {value: TEMPERATURE_FOR_OCEAN_BONUS, title: `${TEMPERATURE_FOR_OCEAN_BONUS}°: place an ocean`, kind: 'ocean'},
      ];
    },
    oceanPips(): Array<{index: number, points: string, on: boolean}> {
      return Array.from({length: this.maximums.oceans}, (_, i) => ({
        index: i,
        points: hexPoints(150 + i * 17, 591, 7.5),
        on: i < this.oceans,
      }));
    },
    ariaLabel(): string {
      return `Mars. Oxygen ${this.oxygen} of ${this.maximums.oxygen} percent, ` +
        `temperature ${this.temperature} degrees, oceans ${this.oceans} of ${this.maximums.oceans}.`;
    },
  },
  methods: {
    bonusIcon(kind: BonusKind): string {
      return BONUS_ICONS[kind];
    },
    tempY(value: number): number {
      const fraction = (value - MIN_TEMPERATURE) / (this.maximums.temperature - MIN_TEMPERATURE);
      return T_BOTTOM - fraction * (T_BOTTOM - T_TOP);
    },
    temperatureText(value: number): string {
      if (value > 0) {
        return '+' + value;
      }
      return value < 0 ? '−' + Math.abs(value) : '0';
    },
  },
});
</script>
