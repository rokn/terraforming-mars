import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameHeader from '@/client/components/GameHeader.vue';
import {fakeGameModel, fakePlayerViewModel, fakeTurmoilModel} from './testHelpers';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {Phase} from '@/common/Phase';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';

describe('GameHeader', () => {
  it('shows the generation, phase and progress', () => {
    const wrapper = shallowMount(GameHeader, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({
          game: fakeGameModel({generation: 9, phase: Phase.ACTION, temperature: 8, oxygenLevel: 14, oceans: 9}),
        }),
      },
    });
    expect(wrapper.find('[data-test=generation]').text()).eq('09');
    const phases = wrapper.findAll('[data-test=phase]');
    expect(phases.map((p) => p.classes().includes('tm-header-phase--current'))).deep.eq([false, true, false]);
    expect(wrapper.find('[data-test=terraformed]').text()).eq('100%');
  });

  it('flags the player\'s turn only when a required input is waiting', () => {
    const waiting = shallowMount(GameHeader, {...globalConfig, props: {playerView: fakePlayerViewModel()}});
    expect(waiting.find('[data-test=your-turn]').exists()).is.false;

    const acting = shallowMount(GameHeader, {
      ...globalConfig,
      props: {playerView: fakePlayerViewModel({waitingFor: {type: 'option', title: 'x', buttonLabel: 'ok'} as PlayerInputModel})},
    });
    expect(acting.find('[data-test=your-turn]').exists()).is.true;
  });

  it('replaces the phase strip once the game is over', () => {
    const wrapper = shallowMount(GameHeader, {...globalConfig, props: {playerView: fakePlayerViewModel({game: fakeGameModel({phase: Phase.END})})}});
    expect(wrapper.findAll('[data-test=phase]')).has.length(0);
    expect(wrapper.find('.tm-header-over').exists()).is.true;
  });

  it('names the ruling party in Turmoil games', () => {
    expect(shallowMount(GameHeader, {...globalConfig, props: {playerView: fakePlayerViewModel()}}).find('[data-test=ruling]').exists()).is.false;
    const wrapper = shallowMount(GameHeader, {...globalConfig, props: {playerView: fakePlayerViewModel({game: fakeGameModel({turmoil: fakeTurmoilModel()})})}});
    expect(wrapper.findComponent(PartyChip).props('party')).eq(PartyName.SCIENTISTS);
  });
});
