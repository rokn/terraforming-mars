import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CorporationsPanel from '@/client/components/overview/CorporationsPanel.vue';
import {fakeGameModel, fakePlayerViewModel, fakePublicPlayerModel} from '../testHelpers';
import {CardName} from '@/common/cards/CardName';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';

describe('CorporationsPanel', () => {
  const me = fakePublicPlayerModel({color: 'blue', name: 'Ada', isActive: true, terraformRating: 38, megacredits: 42,
    tableau: [{name: CardName.CREDICOR}]});
  const other = fakePublicPlayerModel({color: 'red', name: 'Mira', terraformRating: 34, cardsInHandNbr: 3});
  const playerView = fakePlayerViewModel({
    thisPlayer: me,
    players: [me, other],
    game: fakeGameModel({passedPlayers: ['red']}),
  });

  it('lists players in turn order with corporation, TR and status', () => {
    const wrapper = mount(CorporationsPanel, {...globalConfig, props: {playerView}});
    const rows = wrapper.findAll('[data-test=corp-row]');
    expect(rows).has.length(2);
    expect(rows[0].text()).contains(CardName.CREDICOR);
    expect(rows[0].find('[data-test=tr]').text()).eq('38');
    expect(rows[0].find('[data-test=mc]').text()).eq('42');
    expect(rows[0].classes()).contains('tm-corp--me');
    expect(rows[0].find('[data-test=status]').text()).eq('Acting');
    // Without a corporation, the player's name stands in.
    expect(rows[1].find('.tm-corp-name').text()).eq('Mira');
    expect(rows[1].classes()).contains('tm-corp--passed');
    expect(rows[1].find('[data-test=cards]').text()).eq('3');
  });

  it('emits the color of the clicked player', async () => {
    const wrapper = mount(CorporationsPanel, {...globalConfig, props: {playerView}});
    await wrapper.findAll('[data-test=corp-row]')[1].trigger('click');
    expect(wrapper.emitted('select')).deep.eq([['red']]);
  });

  it('shows each player\'s timer only when the game uses timers', () => {
    const base = fakeGameModel();
    const timed = fakePlayerViewModel({
      thisPlayer: me,
      players: [me, other],
      game: fakeGameModel({gameOptions: {...base.gameOptions, showTimers: true}}),
    });
    expect(mount(CorporationsPanel, {...globalConfig, props: {playerView: timed}}).findAll('[data-test=timer]')).has.length(2);
    const untimed = fakePlayerViewModel({
      thisPlayer: me,
      players: [me, other],
      game: fakeGameModel({gameOptions: {...base.gameOptions, showTimers: false}}),
    });
    expect(mount(CorporationsPanel, {...globalConfig, props: {playerView: untimed}}).findAll('[data-test=timer]')).has.length(0);
  });

  it('shows trade fleets and colonies only in a Colonies game', () => {
    const plain = mount(CorporationsPanel, {...globalConfig, props: {playerView}});
    expect(plain.find('[data-test=expansion-stats]').exists()).is.false;

    const colonies = fakePlayerViewModel({
      thisPlayer: me,
      players: [me, other],
      game: fakeGameModel({colonies: [simpleColonyModel(ColonyName.LUNA)]}),
    });
    const wrapper = mount(CorporationsPanel, {...globalConfig, props: {playerView: colonies}});
    expect(wrapper.findAll('[data-test=expansion-stats]')).has.length(2);
  });
});
