import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ColonyTile from '@/client/components/colonies/ColonyTile.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyModel} from '@/common/models/ColonyModel';
import {fakePublicPlayerModel} from '../testHelpers';

const luna: ColonyModel = {colonies: ['red', 'blue'], isActive: true, name: ColonyName.LUNA, trackPosition: 3, visitor: 'green'};
const players = [fakePublicPlayerModel({color: 'green', name: 'Kenji'})];

describe('ColonyTile', () => {
  it('spells out colonies, trade income and the docked fleet', () => {
    const wrapper = mount(ColonyTile, {...globalConfig, props: {colony: luna, players}});
    expect(wrapper.find('[data-test=colony-owners]').text()).contains('2/3');
    // Luna's trade row is 1, 2, 4, 7, …
    expect(wrapper.find('[data-test=colony-trade-now]').text()).contains('7');
    expect(wrapper.find('[data-test=colony-visitor]').text()).contains('Kenji');
    expect(wrapper.find('[data-test=colony-inactive]').exists()).is.false;
  });

  it('labels an inactive tile', () => {
    const enceladus: ColonyModel = {colonies: [], isActive: false, name: ColonyName.ENCELADUS, trackPosition: 1, visitor: undefined};
    const wrapper = mount(ColonyTile, {...globalConfig, props: {colony: enceladus}});
    expect(wrapper.classes()).contains('tm-colony-tile--inactive');
    expect(wrapper.find('[data-test=colony-inactive]').text()).contains('Inactive');
    expect(wrapper.find('[data-test=colony-trade-now]').exists()).is.false;
  });

  it('emits its name when clicked, only when selectable', async () => {
    const wrapper = mount(ColonyTile, {...globalConfig, props: {colony: luna, players}});
    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).is.undefined;

    await wrapper.setProps({selectable: true});
    await wrapper.trigger('click');
    await wrapper.trigger('keydown', {key: 'Enter'});
    expect(wrapper.emitted('select')).deep.eq([[ColonyName.LUNA], [ColonyName.LUNA]]);
  });
});
