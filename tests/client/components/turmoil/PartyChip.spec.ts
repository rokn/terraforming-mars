import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {partyColors} from '@/client/utils/turmoil';

describe('PartyChip', () => {
  it('names the party on its colour', () => {
    const wrapper = mount(PartyChip, {...globalConfig, props: {party: PartyName.REDS}});
    expect(wrapper.text()).eq('Reds');
    expect(wrapper.attributes('style')).contains(partyColors(PartyName.REDS).fill);
  });
});
