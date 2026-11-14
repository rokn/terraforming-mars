import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import GameEnd from '@/client/components/GameEnd.vue';
import {fakePlayerViewModel, fakePublicPlayerModel} from './testHelpers';

describe('GameEnd', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {
        participant: fakePlayerViewModel(),
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows a dashboard with standings and switchable details for multiplayer games', async () => {
    const players = [fakePublicPlayerModel({color: 'blue', name: 'Ada'}), fakePublicPlayerModel({color: 'red', name: 'Mira'})];
    const wrapper = shallowMount(GameEnd, {
      ...globalConfig,
      props: {participant: fakePlayerViewModel({players})},
    });
    expect(wrapper.classes()).contains('tm-end--app');
    expect(wrapper.findComponent({name: 'FinalStandings'}).exists()).is.true;
    expect(wrapper.findAll('[data-test=end-source]')).has.length(2);
    expect(wrapper.find('.tm-end-tab--board').isVisible()).is.true;

    await wrapper.find('[data-test=end-tab-globals]').trigger('click');
    expect(wrapper.find('.tm-end-table').exists()).is.true;
    expect(wrapper.findAll('.tm-end-table tbody tr')).has.length(2);
  });
});
