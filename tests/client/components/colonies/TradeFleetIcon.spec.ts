import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import TradeFleetIcon from '@/client/components/colonies/TradeFleetIcon.vue';

describe('TradeFleetIcon', () => {
  it('is filled when free and outlined when used', async () => {
    const wrapper = mount(TradeFleetIcon, {...globalConfig, props: {color: 'red'}});
    expect(wrapper.find('path').attributes('fill')).not.eq('none');
    await wrapper.setProps({used: true});
    expect(wrapper.classes()).contains('tm-fleet-icon--used');
    expect(wrapper.find('path').attributes('fill')).eq('none');
  });
});
