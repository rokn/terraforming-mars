import {expect} from 'chai';
import {CardName} from '@/common/cards/CardName';
import {PlayerInputModel, SelectProjectCardToPlayModel} from '@/common/models/PlayerInputModel';
import {actionableCards, playableCards, requestAction, requestPlay, takeRequestedAction, takeRequestedCard} from '@/client/utils/quickActions';
import {isActionMenu, isPreludeChoice} from '@/client/utils/actionKind';

describe('quickActions', () => {
  it('lists enabled cards from a play card option', () => {
    const playCard = {
      type: 'projectCard',
      title: 'Play project card',
      buttonLabel: '',
      cards: [{name: CardName.ANTS, isDisabled: true}, {name: CardName.BIRDS}],
    } as unknown as SelectProjectCardToPlayModel;
    const input: PlayerInputModel = {type: 'or', title: '', buttonLabel: '', options: [{type: 'option', title: 'Pass', buttonLabel: ''}, playCard]};
    expect(playableCards(input)).deep.eq([CardName.BIRDS]);
    expect(playableCards(undefined)).deep.eq([]);
  });

  it('hands over a requested card once', () => {
    requestPlay(CardName.BIRDS);
    expect(takeRequestedCard()).eq(CardName.BIRDS);
    expect(takeRequestedCard()).is.undefined;
  });

  it('lists played cards whose action can be used', () => {
    const input = {
      type: 'or',
      title: '',
      buttonLabel: '',
      options: [
        {type: 'card', title: 'Perform an action from a played card', buttonLabel: '', cards: [{name: CardName.BIRDS}, {name: CardName.ANTS, isDisabled: true}]},
        {type: 'card', title: 'Sell patents', buttonLabel: '', cards: [{name: CardName.CARTEL}]},
        {type: 'option', title: 'Pass for this generation', buttonLabel: ''},
      ],
    } as unknown as PlayerInputModel;
    expect(actionableCards(input)).deep.eq([CardName.BIRDS]);
    expect(isActionMenu(input)).is.true;
    expect(isActionMenu({type: 'option', title: 'Select a', buttonLabel: ''})).is.false;
  });

  it('hands over a requested action once', () => {
    requestAction(CardName.BIRDS);
    expect(takeRequestedAction()).eq(CardName.BIRDS);
    expect(takeRequestedAction()).is.undefined;
  });

  it('recognizes the prelude phase choice', () => {
    const choice = {type: 'card', title: 'Select prelude card to play', buttonLabel: 'Play', cards: []} as unknown as PlayerInputModel;
    expect(isPreludeChoice(choice)).is.true;
    expect(isPreludeChoice({...choice, title: 'Select card to discard'} as PlayerInputModel)).is.false;
    expect(isPreludeChoice(undefined)).is.false;
  });
});
