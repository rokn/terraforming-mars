import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import FinalStandings from '@/client/components/gameend/FinalStandings.vue';
import {fakeGameModel, fakePublicPlayerModel} from '../testHelpers';

describe('FinalStandings', () => {
  const breakdown = (tr: number, cards: number) => ({...fakePublicPlayerModel().victoryPointsBreakdown, terraformRating: tr, victoryPoints: cards, total: tr + cards});
  const first = fakePublicPlayerModel({color: 'blue', name: 'Ada', victoryPointsBreakdown: breakdown(40, 6)});
  const second = fakePublicPlayerModel({color: 'red', name: 'Mira', victoryPointsBreakdown: breakdown(35, 4)});

  it('ranks players and names the winner', () => {
    const wrapper = mount(FinalStandings, {
      ...globalConfig,
      props: {game: fakeGameModel(), players: [first, second], winners: [first]},
    });
    const rows = wrapper.findAll('[data-test=standing]');
    expect(rows).has.length(2);
    expect(rows[0].find('[data-test=total]').text()).eq('46');
    expect(rows[0].findAll('.tm-standings-seg')).has.length(2);
    expect(wrapper.find('[data-test=winner]').text()).contains('Ada');
    expect(wrapper.find('[data-test=winner]').text()).contains('7');
  });

  it('shows the points for each category in every row', () => {
    const wrapper = mount(FinalStandings, {
      ...globalConfig,
      props: {game: fakeGameModel(), players: [first, second], winners: [first]},
    });
    const cells = wrapper.findAll('[data-test=standing]')[0].findAll('[data-test=cell]').map((c) => c.text());
    // TR, milestones, awards, greenery, cities, cards.
    expect(cells).deep.eq(['40', '0', '0', '0', '0', '6']);
    expect(wrapper.findAll('[data-test=standing]')[0].find('[data-test=extra]').text()).contains('actions');
  });
});
