import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {Color} from '@/common/Color';

// Labels describing the player's current state
export type ActionLabel = 'active' | 'passed' | 'next' | 'none' | 'drafting' | 'researching' | '';

// The minimum number of players before anyone is labeled 'next'.
const SHOW_NEXT_LABEL_MIN = 2;

/* The index of the player with `color` in `players`, or -1 when absent. */
export function playerIndex(color: Color, players: ReadonlyArray<PublicPlayerModel>): number {
  return players.findIndex((p) => p.color === color);
}

/* Describes what `player` is doing right now in the game shown by `viewModel`. */
export function getActionLabel(viewModel: ViewModel, player: PublicPlayerModel): ActionLabel {
  const game = viewModel.game;
  const players = viewModel.players;
  if (game.phase === Phase.DRAFTING) {
    return player.needsToDraft ? 'drafting' : 'none';
  } else if (game.phase === Phase.RESEARCH) {
    return player.needsToResearch ? 'researching' : 'none';
  } else if (game.phase === Phase.SOLAR) {
    // World Government Advisor and Terra briefly enter the Solar phase during the active player's turn.
    // Otherwise this is World Government Terraforming, where activePlayer is stale and the running
    // timer shows who is deciding.
    const activePlayerIsDeciding = players.some((p) => p.isActive && p.timer.running);
    if (!activePlayerIsDeciding) {
      return player.timer.running ? 'active' : 'none';
    }
  }
  if (game.passedPlayers.includes(player.color)) {
    return 'passed';
  }
  if (player.isActive) {
    return 'active';
  }
  const notPassedPlayers = players.filter((p) => !game.passedPlayers.includes(p.color));
  const currentPlayerIndex = playerIndex(player.color, notPassedPlayers);
  if (currentPlayerIndex === -1) {
    return 'none';
  }
  const prevPlayerIndex = currentPlayerIndex === 0 ? notPassedPlayers.length - 1 : currentPlayerIndex - 1;
  const isNext = notPassedPlayers[prevPlayerIndex].isActive;
  if (isNext && players.length > SHOW_NEXT_LABEL_MIN) {
    return 'next';
  }
  return 'none';
}
