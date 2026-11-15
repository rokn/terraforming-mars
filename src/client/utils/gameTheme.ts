import {Color} from '@/common/Color';
import {Phase} from '@/common/Phase';
import {BoardName} from '@/common/boards/BoardName';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {MAX_VENUS_SCALE, MIN_OXYGEN_LEVEL, MIN_TEMPERATURE} from '@/common/constants';

/** Base fill for each player color, as drawn by the in-game theme. */
const PLAYER_HEX: Record<Color, string> = {
  red: '#E5484D',
  green: '#46A758',
  yellow: '#F5C451',
  blue: '#3E8EF7',
  black: '#8A8E96',
  purple: '#9B6BF2',
  orange: '#F08A2C',
  pink: '#F574BB',
  turquoise: '#1EC8BE',
  clear: '#CDE4F6',
  neutral: '#A0A0A0',
  bronze: '#B87333',
};

/** Three shades of a player color: top, left and right faces of an isometric cube. */
export type CubeShades = {top: string, left: string, right: string};

function shade(hex: string, f: number): string {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const out = channels.map((v) => Math.round(f > 0 ? v + (255 - v) * f : v * (1 + f)));
  return '#' + out.map((v) => v.toString(16).padStart(2, '0')).join('');
}

/* The base fill for `color`. */
export function playerHex(color: Color): string {
  return PLAYER_HEX[color] ?? PLAYER_HEX.neutral;
}

/* Shades for drawing `color` as a lit isometric cube. */
export function cubeShades(color: Color): CubeShades {
  const base = playerHex(color);
  return {top: shade(base, 0.35), left: base, right: shade(base, -0.35)};
}

/** A generation step shown in the header's phase strip. */
export type PhaseStep = 'research' | 'action' | 'production';

/* The phase-strip step that `phase` belongs to, or undefined once the game is over. */
export function phaseStep(phase: Phase): PhaseStep | undefined {
  switch (phase) {
  case Phase.INITIALDRAFTING:
  case Phase.DRAFTING:
  case Phase.RESEARCH:
    return 'research';
  case Phase.PRELUDES:
  case Phase.CEOS:
  case Phase.ACTION:
    return 'action';
  case Phase.PRODUCTION:
  case Phase.SOLAR:
  case Phase.INTERGENERATION:
    return 'production';
  case Phase.END:
    return undefined;
  }
}

/** The values that determine how terraformed Mars is. */
export type GlobalParameterValues = {
  temperature: number,
  oxygenLevel: number,
  oceans: number,
  /* The Venus scale level, counted only when `includeVenus` is passed to `terraformedPercent`. */
  venusScaleLevel?: number,
};

/* Number of Venus steps from 0% to `level`: 2% each up to 30%, then 1% each. */
function venusSteps(level: number): number {
  return level <= MAX_VENUS_SCALE ? level / 2 : MAX_VENUS_SCALE / 2 + level - MAX_VENUS_SCALE;
}

/*
 * Percentage (0-100) of temperature, oxygen and ocean steps completed on `boardName`, and of Venus
 * steps when `includeVenus`.
 *
 * Every step counts equally, which matches how much TR terraforming has produced.
 */
export function terraformedPercent(values: GlobalParameterValues, boardName: BoardName, includeVenus = false): number {
  const max = getGlobalParameterMaximums(boardName);
  const temperatureSteps = (max.temperature - MIN_TEMPERATURE) / 2;
  let total = temperatureSteps + (max.oxygen - MIN_OXYGEN_LEVEL) + max.oceans;
  let done = (values.temperature - MIN_TEMPERATURE) / 2 + (values.oxygenLevel - MIN_OXYGEN_LEVEL) + values.oceans;
  if (includeVenus) {
    total += venusSteps(max.venus);
    done += venusSteps(values.venusScaleLevel ?? 0);
  }
  return Math.round(Math.min(100, Math.max(0, 100 * done / total)));
}
