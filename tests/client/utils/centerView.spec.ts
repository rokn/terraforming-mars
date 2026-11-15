import {expect} from 'chai';
import {centerViewForKey, centerViews, loadCenterView, needsColonies, needsParties, needsTurmoil, saveCenterView, viewForInput} from '@/client/utils/centerView';
import {fakeTurmoilModel} from '../components/testHelpers';
import {PartyName} from '@/common/turmoil/PartyName';
import {fakeGameModel} from '../components/testHelpers';
import {useFakeLocalStorage} from '../components/FakeLocalStorage';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';
import {PlayerInputModel, SelectColonyModel} from '@/common/models/PlayerInputModel';

const selectColony: SelectColonyModel = {type: 'colony', title: 'Select colony', buttonLabel: 'Build', coloniesModel: [simpleColonyModel(ColonyName.LUNA)]};

describe('centerView', () => {
  useFakeLocalStorage();

  it('offers Colonies only in games with colonies', () => {
    expect(centerViews(fakeGameModel())).deep.eq(['mars']);
    expect(centerViews(fakeGameModel({colonies: [simpleColonyModel(ColonyName.LUNA)]}))).deep.eq(['mars', 'colonies']);
  });

  it('remembers the chosen view', () => {
    expect(loadCenterView()).is.undefined;
    saveCenterView('colonies');
    expect(loadCenterView()).eq('colonies');
    localStorage.setItem('tm_center_view', 'nonsense');
    expect(loadCenterView()).is.undefined;
  });

  it('maps M and C to views, but not with modifiers', () => {
    expect(centerViewForKey(new KeyboardEvent('keydown', {code: 'KeyM'}))).eq('mars');
    expect(centerViewForKey(new KeyboardEvent('keydown', {code: 'KeyC'}))).eq('colonies');
    expect(centerViewForKey(new KeyboardEvent('keydown', {code: 'KeyC', ctrlKey: true}))).is.undefined;
    expect(centerViewForKey(new KeyboardEvent('keydown', {code: 'KeyX'}))).is.undefined;
  });

  it('finds colony choices nested in other choices', () => {
    const trade: PlayerInputModel = {type: 'and', title: 'Trade with a colony tile', buttonLabel: 'Trade', options: [
      {type: 'or', title: 'Pay trade fee', buttonLabel: 'Pay', options: []},
      selectColony,
    ]};
    expect(needsColonies(selectColony)).is.true;
    expect(needsColonies(trade)).is.true;
    expect(needsColonies({type: 'option', title: 'OK', buttonLabel: 'OK'})).is.false;
    expect(needsColonies(undefined)).is.false;
  });

  it('picks the view an input needs', () => {
    expect(viewForInput(selectColony)).eq('colonies');
    expect(viewForInput({type: 'space', title: 'Select space', buttonLabel: 'OK', spaces: []})).eq('mars');
    expect(viewForInput({type: 'option', title: 'OK', buttonLabel: 'OK'})).is.undefined;
  });

  it('offers Turmoil in Turmoil games, on the T key', () => {
    expect(centerViews(fakeGameModel({turmoil: fakeTurmoilModel()}))).deep.eq(['mars', 'turmoil']);
    expect(centerViewForKey(new KeyboardEvent('keydown', {code: 'KeyT'}))).eq('turmoil');
  });

  it('finds Turmoil choices, nested or not', () => {
    const party: PlayerInputModel = {type: 'party', title: 'Send a delegate', buttonLabel: 'Send', parties: [PartyName.REDS]};
    const delegate: PlayerInputModel = {type: 'delegate', title: 'Remove a delegate', buttonLabel: 'Remove', players: ['NEUTRAL']};
    const banned: PlayerInputModel = {type: 'or', title: 'Choose', buttonLabel: 'OK', options: [delegate]};
    expect(needsParties(party)).is.true;
    expect(needsParties(banned)).is.false;
    expect(needsTurmoil(banned)).is.true;
    expect(needsTurmoil(selectColony)).is.false;
    expect(viewForInput(party)).eq('turmoil');
    expect(viewForInput(banned)).eq('turmoil');
  });
});
