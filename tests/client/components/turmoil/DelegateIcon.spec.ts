import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';
import {playerHex} from '@/client/utils/gameTheme';

describe('DelegateIcon', () => {
  it('draws the delegate in the player colour', () => {
    const wrapper = mount(DelegateIcon, {...globalConfig, props: {color: 'blue', size: 20}});
    expect(wrapper.attributes('width')).eq('20');
    expect(wrapper.find('circle').attributes('fill')).eq(playerHex('blue'));
  });
});
