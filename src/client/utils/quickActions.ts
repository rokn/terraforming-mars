import {reactive} from 'vue';
import {CardName} from '@/common/cards/CardName';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {actionKind} from '@/client/utils/actionKind';

/**
 * Links the hand and the tableau with the action menu, so cards can be played and used where they are.
 *
 * - `card`: a request, made from the hand, to play a card. The action menu opens its quick play
 *   dialog for it and clears the request.
 * - `highlight`: set while the menu asks the player to pick a card from their hand.
 * - `actionCard`: a request, made from the tableau, to use a card's action. The menu submits it.
 * - `focusActions`: set while the menu asks the player to pick a card on their tableau.
 * - `followUp`: set once a quick action is submitted, so the choices the server asks for next
 *   show in a dialog rather than in the operations panel.
 */
export const quickActions = reactive<{
  card: CardName | undefined,
  highlight: boolean,
  actionCard: CardName | undefined,
  focusActions: boolean,
  followUp: boolean,
}>({card: undefined, highlight: false, actionCard: undefined, focusActions: false, followUp: false});

export function requestPlay(card: CardName): void {
  quickActions.card = card;
}

/** Returns the requested card and clears the request. */
export function takeRequestedCard(): CardName | undefined {
  const card = quickActions.card;
  quickActions.card = undefined;
  return card;
}

export function requestAction(card: CardName): void {
  quickActions.actionCard = card;
}

/** Returns the card whose action was requested and clears the request. */
export function takeRequestedAction(): CardName | undefined {
  const card = quickActions.actionCard;
  quickActions.actionCard = undefined;
  return card;
}

function enabledCards(input: PlayerInputModel): Array<CardName> {
  return input.type === 'projectCard' || input.type === 'card' ?
    input.cards.filter((c) => c.isDisabled !== true).map((c) => c.name) :
    [];
}

/** The cards in hand that `input` lets the player play now. */
export function playableCards(input: PlayerInputModel | undefined): Array<CardName> {
  if (input === undefined) {
    return [];
  }
  if (input.type === 'projectCard') {
    return enabledCards(input);
  }
  if (input.type === 'or') {
    return input.options.flatMap((option) => option.type === 'projectCard' ? playableCards(option) : []);
  }
  return [];
}

/** The played cards whose action `input` lets the player use now. */
export function actionableCards(input: PlayerInputModel | undefined): Array<CardName> {
  if (input?.type !== 'or') {
    return [];
  }
  return input.options.flatMap((option) => option.type === 'card' && actionKind(option) === 'card-action' ? enabledCards(option) : []);
}
