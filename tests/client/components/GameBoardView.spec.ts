import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameBoardView from '@/client/components/GameBoardView.vue';
import {fakeGameModel, fakeTurmoilModel} from './testHelpers';
import Turmoil from '@/client/components/turmoil/Turmoil.vue';

describe('GameBoardView', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameBoardView, {
      ...globalConfig,
      props: {
        game: fakeGameModel(),
        tileView: 'show',
        players: [],
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows the Turmoil board unless asked not to', () => {
    const props = {game: fakeGameModel({turmoil: fakeTurmoilModel()}), tileView: 'show' as const, players: []};
    expect(shallowMount(GameBoardView, {...globalConfig, props}).findComponent(Turmoil).exists()).is.true;
    expect(shallowMount(GameBoardView, {...globalConfig, props: {...props, showTurmoil: false}}).findComponent(Turmoil).exists()).is.false;
  });
});
