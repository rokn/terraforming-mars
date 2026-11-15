import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameHome from '@/client/components/GameHome.vue';
import {fakeGameOptionsModel} from './testHelpers';
import {Phase} from '@/common/Phase';
import {SimpleGameModel} from '@/common/models/SimpleGameModel';
import {asComplete} from './utils/models';

describe('GameHome', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameHome, {
      ...globalConfig,
      props: {
        game: asComplete<SimpleGameModel>({
          activePlayer: 'blue',
          id: 'game-id-123',
          phase: Phase.ACTION,
          players: [{color: 'blue', id: 'p-blue', name: 'Blue'}],
          spectatorId: 'spectator-id-123',
          gameOptions: fakeGameOptionsModel(),
          lastSoloGeneration: 14,
          expectedPurgeTimeMs: 0,
        }),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows a seat with a link for each player and the spectator', () => {
    const wrapper = shallowMount(GameHome, {
      ...globalConfig,
      props: {game: twoPlayerGame()},
    });
    const seats = wrapper.findAll('.tm-seat');
    expect(seats).has.length(3);
    expect(seats[0].text()).contains('Alice');
    expect(seats[0].get('input').element.value).match(/player\?id=p-alice$/);
    expect(seats[0].get('a.tm-seat-open').attributes('href')).eq('player?id=p-alice');
    expect(seats[2].get('input').element.value).match(/spectator\?id=spectator-id$/);
    expect(wrapper.get('h1').text()).contains('game-id-123');
  });

  it('builds an invite message with every link', () => {
    const wrapper = shallowMount(GameHome, {
      ...globalConfig,
      props: {game: twoPlayerGame()},
    });
    const message: string = (wrapper.vm as any).inviteMessage();
    const lines = message.split('\n');
    expect(lines).has.length(3);
    expect(lines[0]).match(/^Alice: .*player\?id=p-alice$/);
    expect(lines[1]).match(/^Bob: .*player\?id=p-bob$/);
    expect(lines[2]).match(/^Spectator: .*spectator\?id=spectator-id$/);
  });
});

function twoPlayerGame(): SimpleGameModel {
  return asComplete<SimpleGameModel>({
    activePlayer: 'red',
    id: 'game-id-123',
    phase: Phase.ACTION,
    players: [{color: 'red', id: 'p-alice', name: 'Alice'}, {color: 'blue', id: 'p-bob', name: 'Bob'}],
    spectatorId: 'spectator-id',
    gameOptions: fakeGameOptionsModel(),
    lastSoloGeneration: 14,
    expectedPurgeTimeMs: 0,
  });
}

