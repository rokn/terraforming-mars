import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayerExpansionStats from '@/client/components/overview/PlayerExpansionStats.vue';
import {fakeGameModel, fakePublicPlayerModel} from '../testHelpers';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';

describe('PlayerExpansionStats', () => {
  const player = fakePublicPlayerModel({fleetSize: 2, tradesThisGeneration: 1, coloniesCount: 3});

  it('shows nothing without expansions', () => {
    const wrapper = mount(PlayerExpansionStats, {...globalConfig, props: {player, game: fakeGameModel()}});
    expect(wrapper.find('[data-test=expansion-stats]').exists()).is.false;
  });

  it('shows free / total fleets and colonies in a Colonies game', () => {
    const game = fakeGameModel({colonies: [simpleColonyModel(ColonyName.LUNA)]});
    const wrapper = mount(PlayerExpansionStats, {...globalConfig, props: {player, game}});
    expect(wrapper.find('[data-test=stat-fleets]').text()).eq('1/2');
    expect(wrapper.find('[data-test=stat-colonies]').text()).eq('3');
  });
});
