<template>
  <div class="tm-stockpile">
    <div v-for="row in rows" :key="row.type" class="tm-stock" :class="'tm-stock--' + row.type" :data-test="'stock-' + row.type">
      <span v-if="flash[row.type] !== undefined" :key="'flash' + effectKey(flash, row.type)"
        class="tm-stock-flash" :class="effectClass('tm-stock-flash', flash, row.type)" aria-hidden="true"></span>
      <span class="tm-stock-plate" :key="'plate' + effectKey(flash, row.type)"
        :class="{'tm-stock-plate--pop': flash[row.type] !== undefined}" :title="$t(row.label)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path :d="row.icon" />
        </svg>
      </span>
      <span class="tm-stock-body">
        <span class="tm-stock-label"><span v-i18n>{{ row.label }}</span><template v-if="row.rate !== undefined"> · {{ row.rate }} M€</template></span>
        <span class="tm-stock-numbers">
          <span class="tm-stock-amount" data-test="amount">{{ shown[row.type] ?? row.amount }}</span>
          <span class="tm-stock-prod" :key="'prod' + effectKey(prodFlash, row.type)"
            :class="effectClass('tm-stock-prod', prodFlash, row.type)"
            :title="$t('Production count')" data-test="production">{{ row.production > 0 ? '+' : '' }}{{ row.production }}</span>
        </span>
      </span>
      <span v-for="f in floatsFor(row.type)" :key="f.id" class="tm-stock-float" :class="f.value > 0 ? 'tm-stock-float--up' : 'tm-stock-float--down'" data-test="float" aria-hidden="true">
        {{ f.value > 0 ? '+' : '−' }}{{ Math.abs(f.value) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Resource} from '@/common/Resource';
import {Color} from '@/common/Color';
import {DEFAULT_STEEL_VALUE, DEFAULT_TITANIUM_VALUE} from '@/common/constants';

/** One resource tile in the stockpile. */
type Row = {
  type: Resource,
  label: string,
  amount: number,
  production: number,
  /* The M€ value of one unit, shown only when it differs from the default. */
  rate: number | undefined,
  icon: string,
};

type Direction = 'up' | 'down';
/** A flash on a tile; `key` changes with every change so the animation restarts. */
type Flash = {direction: Direction, key: number};
/** A "+3" or "−2" that floats out of a tile. */
type Float = {id: number, type: Resource, value: number};

type Snapshot = {color: Color, amounts: Record<string, number>, production: Record<string, number>};

type DataModel = {
  /** The amount on screen while it counts towards a new value. */
  shown: Partial<Record<Resource, number>>,
  flash: Partial<Record<Resource, Flash>>,
  prodFlash: Partial<Record<Resource, Flash>>,
  floats: Array<Float>,
  frames: Partial<Record<Resource, number>>,
  timers: Array<ReturnType<typeof setTimeout>>,
};

const ICONS: Record<string, string> = {
  [Resource.MEGACREDITS]: 'M12 4a8 8 0 1 0 0 16a8 8 0 1 0 0-16M15 9.5a3.5 3.5 0 1 0 0 5M8 11h5M8 13h5',
  [Resource.STEEL]: 'M6 6h12M6 18h12M12 6v12',
  [Resource.TITANIUM]: 'M12 4l7 8-7 8-7-8z',
  [Resource.PLANTS]: 'M5 19c0-8 6-14 14-14 0 8-6 14-14 14zM5 19l7-7',
  [Resource.ENERGY]: 'M13 3L5 14h6l-1 7 8-11h-6z',
  [Resource.HEAT]: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 1 1 2 2 3 1-1-2 0-4 0-5z',
};

/** How long the amount takes to count to its new value, and how long effects stay. */
const COUNT_MS = 650;
const EFFECT_MS = 1500;

let nextId = 0;

function reducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default defineComponent({
  name: 'ResourceStockpile',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
  },
  data(): DataModel {
    return {
      shown: {},
      flash: {},
      prodFlash: {},
      floats: [],
      frames: {},
      timers: [],
    };
  },
  computed: {
    rows(): Array<Row> {
      const p = this.player;
      const row = (type: Resource, label: string, amount: number, production: number, rate?: number): Row =>
        ({type, label, amount, production, rate, icon: ICONS[type]});
      return [
        row(Resource.MEGACREDITS, 'Megacredits', p.megacredits, p.megacreditProduction),
        row(Resource.STEEL, 'Steel', p.steel, p.steelProduction, p.steelValue !== DEFAULT_STEEL_VALUE ? p.steelValue : undefined),
        row(Resource.TITANIUM, 'Titanium', p.titanium, p.titaniumProduction, p.titaniumValue !== DEFAULT_TITANIUM_VALUE ? p.titaniumValue : undefined),
        row(Resource.PLANTS, 'Plants', p.plants, p.plantProduction),
        row(Resource.ENERGY, 'Energy', p.energy, p.energyProduction),
        row(Resource.HEAT, 'Heat', p.heat, p.heatProduction),
      ];
    },
    snapshot(): Snapshot {
      const amounts: Record<string, number> = {};
      const production: Record<string, number> = {};
      for (const row of this.rows) {
        amounts[row.type] = row.amount;
        production[row.type] = row.production;
      }
      return {color: this.player.color, amounts, production};
    },
  },
  watch: {
    snapshot(now: Snapshot, before: Snapshot) {
      // A different player is a new board, not a change.
      if (now.color !== before.color) {
        this.shown = {};
        return;
      }
      for (const row of this.rows) {
        const type = row.type;
        const delta = now.amounts[type] - before.amounts[type];
        if (delta !== 0) {
          this.animateAmount(type, before.amounts[type], now.amounts[type]);
          this.flash[type] = {direction: delta > 0 ? 'up' : 'down', key: ++nextId};
          this.addFloat(type, delta);
        }
        const prodDelta = now.production[type] - before.production[type];
        if (prodDelta !== 0) {
          this.prodFlash[type] = {direction: prodDelta > 0 ? 'up' : 'down', key: ++nextId};
        }
      }
    },
  },
  beforeUnmount() {
    this.timers.forEach((t) => clearTimeout(t));
    Object.values(this.frames).forEach((f) => f !== undefined && cancelAnimationFrame(f));
  },
  methods: {
    effectKey(effects: Partial<Record<Resource, Flash>>, type: Resource): number {
      return effects[type]?.key ?? 0;
    },
    effectClass(prefix: string, effects: Partial<Record<Resource, Flash>>, type: Resource): string | undefined {
      const effect = effects[type];
      return effect === undefined ? undefined : prefix + '--' + effect.direction;
    },
    floatsFor(type: Resource): Array<Float> {
      return this.floats.filter((f) => f.type === type);
    },
    addFloat(type: Resource, value: number): void {
      if (reducedMotion()) {
        return;
      }
      const id = ++nextId;
      this.floats.push({id, type, value});
      this.timers.push(setTimeout(() => {
        this.floats = this.floats.filter((f) => f.id !== id);
      }, EFFECT_MS));
    },
    /* Counts the shown amount from `from` to `to`, easing out. */
    animateAmount(type: Resource, from: number, to: number): void {
      const previous = this.frames[type];
      if (previous !== undefined) {
        cancelAnimationFrame(previous);
      }
      if (reducedMotion() || typeof requestAnimationFrame !== 'function') {
        delete this.shown[type];
        return;
      }
      const start = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / COUNT_MS);
        const eased = 1 - Math.pow(1 - t, 3);
        this.shown[type] = Math.round(from + (to - from) * eased);
        if (t < 1) {
          this.frames[type] = requestAnimationFrame(step);
        } else {
          delete this.shown[type];
          delete this.frames[type];
        }
      };
      this.shown[type] = from;
      this.frames[type] = requestAnimationFrame(step);
    },
  },
});
</script>
