import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerSetupView from '@/client/components/PlayerSetupView.vue';
import {fakeGameModel, fakePlayerViewModel} from './testHelpers';
import {useFakeLocalStorage} from './FakeLocalStorage';
import ColoniesView from '@/client/components/colonies/ColoniesView.vue';
import CenterViewTabs from '@/client/components/common/CenterViewTabs.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';

describe('PlayerSetupView', () => {
  useFakeLocalStorage();

  it('mounts without errors', () => {
    const wrapper = shallowMount(PlayerSetupView, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        tileView: 'show',
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows the colonies in play when the Colonies tab is chosen', async () => {
    const wrapper = shallowMount(PlayerSetupView, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel({game: fakeGameModel({colonies: [simpleColonyModel(ColonyName.LUNA)]})}),
        tileView: 'show',
      },
    });
    expect(wrapper.findComponent(ColoniesView).exists()).is.false;
    wrapper.findComponent(CenterViewTabs).vm.$emit('update:modelValue', 'colonies');
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(ColoniesView).props('colonies')).has.length(1);
  });
});
