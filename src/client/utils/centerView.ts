import {reactive} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {KeyboardNavigation} from '@/client/components/KeyboardNavigation';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

/** The views the centre stage of the game can show, in tab order. */
export const CENTER_VIEWS = ['mars', 'colonies'] as const;
export type CenterView = typeof CENTER_VIEWS[number];

/** A centre view: its tab label, keyboard shortcut (a `KeyboardEvent.code`) and when a game has it. */
type CenterViewSpec = {
  label: string,
  key: string,
  inGame: (game: GameModel) => boolean,
};

export const CENTER_VIEW_SPECS: Record<CenterView, CenterViewSpec> = {
  mars: {label: 'Mars', key: KeyboardNavigation.MARS_VIEW, inGame: () => true},
  colonies: {label: 'Colonies', key: KeyboardNavigation.COLONIES_VIEW, inGame: (game) => game.colonies.length > 0},
};

const STORAGE_KEY = 'tm_center_view';

/** The centre views `game` has. Mars is always first. */
export function centerViews(game: GameModel): Array<CenterView> {
  return CENTER_VIEWS.filter((view) => CENTER_VIEW_SPECS[view].inGame(game));
}

/** The view the player last chose, if storage has one. */
export function loadCenterView(): CenterView | undefined {
  const stored = safeLocalStorage.getItem(STORAGE_KEY);
  return CENTER_VIEWS.find((view) => view === stored);
}

export function saveCenterView(view: CenterView): void {
  safeLocalStorage.setItem(STORAGE_KEY, view);
}

/** The view whose key `event` presses, ignoring presses with modifiers or in text fields. */
export function centerViewForKey(event: KeyboardEvent): CenterView | undefined {
  if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
    return undefined;
  }
  const target = event.target;
  if (target instanceof HTMLElement && (target.isContentEditable || ['input', 'textarea', 'select'].includes(target.nodeName.toLowerCase()))) {
    return undefined;
  }
  return CENTER_VIEWS.find((view) => CENTER_VIEW_SPECS[view].key === event.code);
}

/** True when `input`, or a choice inside it, asks the player to pick a colony tile. */
export function needsColonies(input: PlayerInputModel | undefined): boolean {
  if (input === undefined) {
    return false;
  }
  if (input.type === 'colony') {
    return true;
  }
  return (input.type === 'or' || input.type === 'and') && input.options.some(needsColonies);
}

/** The centre view the player needs to answer `input`, if any. */
export function viewForInput(input: PlayerInputModel | undefined): CenterView | undefined {
  if (input?.type === 'space') {
    return 'mars';
  }
  return needsColonies(input) ? 'colonies' : undefined;
}

/**
 * The colony tiles a choice in the operations panel offers, shared with the Colonies view so the
 * player can pick one there.
 *
 * - `offered`: the tiles the choice accepts; empty when no such choice is showing.
 * - `selected`: the tile picked so far, from either place.
 * - `build`: true when the choice is where to build a colony.
 */
export const colonyPick = reactive<{offered: Array<ColonyName>, selected: ColonyName | undefined, build: boolean}>({offered: [], selected: undefined, build: false});
