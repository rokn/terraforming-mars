import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PoliticsCard from '@/client/components/turmoil/PoliticsCard.vue';
import {fakePublicPlayerModel, fakeTurmoilModel} from '../testHelpers';

const players = [fakePublicPlayerModel({color: 'blue', name: 'Ada'})];

describe('PoliticsCard', () => {
  it('sums up the ruling party, its policy, the dominant party, the chairman and the event', () => {
    const wrapper = mount(PoliticsCard, {...globalConfig, props: {turmoil: fakeTurmoilModel(), players}});
    expect(wrapper.find('[data-test=politics-ruling]').text()).eq('ScientistsPay 10 M€ to draw 3 cards');
    expect(wrapper.find('[data-test=politics-dominant]').text()).eq('Mars First');
    expect(wrapper.find('[data-test=politics-chairman]').text()).eq('Ada');
    expect(wrapper.find('[data-test=politics-event]').text()).contains('Solar Flare');
  });

  it('falls back to the coming event, and opens the Turmoil view', async () => {
    const wrapper = mount(PoliticsCard, {...globalConfig, props: {turmoil: fakeTurmoilModel({current: undefined}), players}});
    expect(wrapper.find('[data-test=politics-event]').text()).contains('Diversity');
    await wrapper.trigger('click');
    expect(wrapper.emitted('open')).has.length(1);
  });
});
