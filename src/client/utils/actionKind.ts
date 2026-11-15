import {PlayerInputModel} from '@/common/models/PlayerInputModel';

/** What a top-level action does, which picks its icon and where it sits in the action menu. */
export type ActionKind =
  'play' | 'standard' | 'card-action' | 'milestone' | 'award' | 'plants' | 'heat' |
  'sell' | 'trade' | 'colony' | 'delegate' | 'pass' | 'end' | 'undo' | 'other';

function titleText(option: PlayerInputModel): string {
  return typeof option.title === 'string' ? option.title : option.title.message;
}

const RULES: ReadonlyArray<[string, ActionKind]> = [
  ['standard project', 'standard'],
  ['action from a played card', 'card-action'],
  ['milestone', 'milestone'],
  ['award', 'award'],
  ['plants into greenery', 'plants'],
  ['heat into temperature', 'heat'],
  ['sell patents', 'sell'],
  ['trade', 'trade'],
  ['colony', 'colony'],
  ['delegate', 'delegate'],
  ['pass', 'pass'],
  ['end turn', 'end'],
  ['undo', 'undo'],
];

/** Works out what an action is from its title (in English, as the server sends it) and input type. */
export function actionKind(option: PlayerInputModel): ActionKind {
  const title = titleText(option).toLowerCase();
  const match = RULES.find(([text]) => title.includes(text))?.[1];
  if (match !== undefined) {
    return match;
  }
  return option.type === 'projectCard' ? 'play' : 'other';
}

/** True when `input` is the player's main choice of actions for their turn (it offers to pass or end the turn). */
export function isActionMenu(input: PlayerInputModel | undefined): boolean {
  return input?.type === 'or' && input.options.some((o) => {
    const kind = actionKind(o);
    return kind === 'pass' || kind === 'end';
  });
}

/** True when `input` asks the player which of their preludes to play. */
export function isPreludeChoice(input: PlayerInputModel | undefined): boolean {
  return input?.type === 'card' && titleText(input) === 'Select prelude card to play';
}
