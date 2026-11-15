import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PartyTile from '@/client/components/turmoil/PartyTile.vue';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {PartyModel} from '@/common/models/TurmoilModel';

const party: PartyModel = {name: PartyName.MARS, partyLeader: 'green', delegates: [{color: 'green', number: 2}, {color: 'blue', number: 1}]};

describe('PartyTile', () => {
  it('shows the leader, the other delegates, the markers and the agenda', () => {
    const wrapper = mount(PartyTile, {...globalConfig, props: {party, agenda: {bonusId: 'mb01', policyId: 'mp01'}, ruling: true}});
    expect(wrapper.find('[data-test=delegate-count]').text()).eq('3');
    // The leader first, then the other delegates.
    expect(wrapper.findAllComponents(DelegateIcon).map((d) => d.props('color'))).deep.eq(['green', 'green', 'blue']);
    expect(wrapper.find('[data-test=ruling]').exists()).is.true;
    expect(wrapper.find('[data-test=dominant]').exists()).is.false;
    expect(wrapper.find('[data-test=bonus]').text()).eq('Gain 1 M€ for each building tag you have');
    expect(wrapper.find('[data-test=policy]').text()).eq('When you place a tile ON MARS, gain 1 steel');
  });

  it('is a button only when selectable', async () => {
    const plain = mount(PartyTile, {...globalConfig, props: {party}});
    expect(plain.element.tagName).eq('DIV');
    await plain.trigger('click');
    expect(plain.emitted('select')).is.undefined;

    const selectable = mount(PartyTile, {...globalConfig, props: {party, selectable: true}});
    expect(selectable.element.tagName).eq('BUTTON');
    await selectable.trigger('click');
    expect(selectable.emitted('select')).deep.eq([[PartyName.MARS]]);
  });
});
