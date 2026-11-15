import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ColoniesView from '@/client/components/colonies/ColoniesView.vue';
import ColonyTile from '@/client/components/colonies/ColonyTile.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';
import {fakePublicPlayerModel} from '../testHelpers';

const colonies = [ColonyName.CERES, ColonyName.EUROPA, ColonyName.LUNA].map(simpleColonyModel);
const players = [
  fakePublicPlayerModel({color: 'blue', name: 'Ada', fleetSize: 2, tradesThisGeneration: 1}),
  fakePublicPlayerModel({color: 'red', name: 'Mira', fleetSize: 1, tradesThisGeneration: 1}),
];

describe('ColoniesView', () => {
  it('shows every tile and each player\'s free and total fleets', () => {
    const wrapper = mount(ColoniesView, {...globalConfig, props: {colonies, players}});
    expect(wrapper.findAllComponents(ColonyTile)).has.length(3);
    expect(wrapper.findAll('[data-test=fleet-count]').map((e) => e.text())).deep.eq(['1/2', '0/1']);
  });

  it('lets the offered tiles be picked, and dims the rest', async () => {
    const wrapper = mount(ColoniesView, {...globalConfig, props: {colonies, players, selectable: [ColonyName.EUROPA]}});
    const tiles = wrapper.findAllComponents(ColonyTile);
    expect(tiles.map((t) => t.props('selectable'))).deep.eq([false, true, false]);
    expect(tiles.map((t) => t.props('dimmed'))).deep.eq([true, false, true]);
    expect(wrapper.find('[data-test=colonies-pick]').exists()).is.true;
    await tiles[1].trigger('click');
    expect(wrapper.emitted('select')).deep.eq([[ColonyName.EUROPA]]);
  });

  it('can leave out the fleets', () => {
    const wrapper = mount(ColoniesView, {...globalConfig, props: {colonies, players, fleets: false}});
    expect(wrapper.find('[data-test=fleets]').exists()).is.false;
  });
});
