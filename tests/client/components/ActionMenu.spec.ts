import {mount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import ActionMenu from '@/client/components/ActionMenu.vue';
import {actionKind} from '@/client/utils/actionKind';
import PlayerInputFactory from '@/client/components/PlayerInputFactory.vue';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {InputResponse} from '@/common/inputs/InputResponse';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel, SelectCardModel, SelectProjectCardToPlayModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';
import {quickActions, requestAction, requestPlay} from '@/client/utils/quickActions';
import {asComplete} from './utils/models';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';
import {fakeGameModel, fakePlayerViewModel, fakePublicPlayerModel} from './testHelpers';
import {Phase} from '@/common/Phase';

const playCard = asComplete<SelectProjectCardToPlayModel>({
  type: 'projectCard',
  title: 'Play project card',
  buttonLabel: 'Play card',
  cards: [{name: CardName.ANTS, isDisabled: true}, {name: CardName.BIRDS}] as SelectProjectCardToPlayModel['cards'],
});

function menu(options: Array<PlayerInputModel>, onsave: (out: InputResponse) => void = () => {}) {
  PreferencesManager.INSTANCE.set('learner_mode', false);
  const playerinput: OrOptionsModel = {type: 'or', title: 'Take your first action', buttonLabel: '', options};
  return mount(ActionMenu, {
    ...globalConfig,
    global: {
      ...globalConfig.global,
      components: {PlayerInputFactory},
      stubs: {SelectProjectCardToPlay: true},
    },
    props: {playerView: asComplete<PlayerViewModel>({}), playerinput, onsave, showsave: true, showtitle: true},
  });
}

describe('ActionMenu', () => {
  it('classifies actions by title', () => {
    const option = (title: string): PlayerInputModel => ({type: 'option', title, buttonLabel: ''});
    expect(actionKind(option('Pass for this generation'))).eq('pass');
    expect(actionKind(option('Convert 8 heat into temperature'))).eq('heat');
    expect(actionKind(option('Something new'))).eq('other');
    expect(actionKind(playCard)).eq('play');
    expect(actionKind({...playCard, title: 'Standard projects'})).eq('standard');
  });

  it('shows a tile per action, with the pass action set apart', () => {
    const wrapper = menu([
      playCard,
      {type: 'option', title: 'Convert 8 heat into temperature', buttonLabel: 'Confirm'},
      {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'},
    ]);
    const tiles = wrapper.findAll('[data-test=action-tile]');
    expect(tiles.map((t) => t.text())).deep.eq(['Play project card1 playable', 'Convert 8 heat into temperature', 'Pass for this generation']);
    expect(wrapper.find('.tm-actions-end').text()).contains('Pass for this generation');
  });

  it('opens an action on its own and saves it with its original index', async () => {
    let saved: InputResponse | undefined;
    const wrapper = menu([
      playCard,
      {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'},
    ], (out) => saved = out);
    await wrapper.findAll('[data-test=action-tile]')[1].trigger('click');
    expect(wrapper.find('[data-test=action-detail]').text()).contains('Pass for this generation');
    await wrapper.findComponent({name: 'AppButton'}).trigger('click');
    expect(saved).deep.eq({type: 'or', index: 1, response: {type: 'option'}});

    await wrapper.find('[data-test=action-back]').trigger('click');
    expect(wrapper.findAll('[data-test=action-tile]')).has.length(2);
  });

  it('points at the hand instead of listing cards', async () => {
    const wrapper = menu([playCard, {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'}]);
    await wrapper.findAll('[data-test=action-tile]')[0].trigger('click');
    expect(quickActions.highlight).is.true;
    expect(wrapper.find('[data-test=action-detail]').exists()).is.false;
    expect(wrapper.find('[data-test=action-hint]').text()).eq('Pick a card from your hand');

    await wrapper.findAll('[data-test=action-tile]')[0].trigger('click');
    expect(quickActions.highlight).is.false;
  });

  it('opens a quick play dialog for a card played from the hand, and saves it', async () => {
    let saved: InputResponse | undefined;
    const wrapper = menu([
      {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'},
      playCard,
    ], (out) => saved = out);
    requestPlay(CardName.BIRDS);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test=play-modal]').exists()).is.true;
    expect(quickActions.card).is.undefined;
    const factory = wrapper.findComponent({ref: 'quickfactory'});
    expect(factory.props('playerinput').cards.map((c: {name: CardName}) => c.name)).deep.eq([CardName.BIRDS]);

    factory.props('onsave')({type: 'projectCard', card: CardName.BIRDS, payment: {}});
    expect(saved).deep.eq({type: 'or', index: 1, response: {type: 'projectCard', card: CardName.BIRDS, payment: {}}});

    await wrapper.find('[data-test=play-modal-cancel]').trigger('click');
    expect(wrapper.find('[data-test=play-modal]').exists()).is.false;
  });

  it('ignores cards that cannot be played', async () => {
    const wrapper = menu([playCard]);
    requestPlay(CardName.ANTS);
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test=play-modal]').exists()).is.false;
  });

  it('points at the tableau for card actions and uses the one picked there', async () => {
    let saved: InputResponse | undefined;
    const cardAction = asComplete<SelectCardModel>({
      type: 'card',
      title: 'Perform an action from a played card',
      buttonLabel: 'Take action',
      min: 1,
      max: 1,
      showOnlyInLearnerMode: false,
      cards: [{name: CardName.BIRDS}] as SelectCardModel['cards'],
    });
    const wrapper = menu([
      {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'},
      cardAction,
    ], (out) => saved = out);
    await wrapper.findAll('[data-test=action-tile]')[0].trigger('click');
    expect(quickActions.focusActions).is.true;
    expect(wrapper.find('[data-test=action-detail]').exists()).is.false;

    requestAction(CardName.BIRDS);
    await wrapper.vm.$nextTick();
    expect(saved).deep.eq({type: 'or', index: 1, response: {type: 'card', cards: [CardName.BIRDS]}});
    expect(quickActions.focusActions).is.false;
    expect(quickActions.followUp).is.true;
    quickActions.followUp = false;
  });

  it('opens trading in a large dialog with the colony tiles, and what follows in a dialog too', async () => {
    const home = document.createElement('div');
    home.id = 'player-home';
    document.body.appendChild(home);
    PreferencesManager.INSTANCE.set('learner_mode', false);
    const trade: PlayerInputModel = {type: 'and', title: 'Trade with a colony tile', buttonLabel: 'Trade', options: [
      {type: 'or', title: 'Pay trade fee', buttonLabel: 'Pay', options: [{type: 'option', title: 'Pay 9 M€', buttonLabel: 'Pay'}]},
      {type: 'colony', title: 'Select colony tile for trade', buttonLabel: 'Trade', coloniesModel: [ColonyName.CERES, ColonyName.LUNA].map(simpleColonyModel)},
    ]};
    let saved: InputResponse | undefined;
    const playerinput: OrOptionsModel = {type: 'or', title: 'Take your first action', buttonLabel: '', options: [
      trade,
      {type: 'option', title: 'Pass for this generation', buttonLabel: 'Pass'},
    ]};
    const thisPlayer = fakePublicPlayerModel({fleetSize: 2, tradesThisGeneration: 1});
    const wrapper = mount(ActionMenu, {
      ...globalConfig,
      attachTo: home,
      global: {
        ...globalConfig.global,
        components: {PlayerInputFactory},
        // The operations panel asks for compact colony choices; the dialog overrides it.
        provide: {compactColonies: () => true},
      },
      props: {playerView: fakePlayerViewModel({thisPlayer}), playerinput, onsave: (out: InputResponse) => saved = out, showsave: true, showtitle: true},
    });
    expect(wrapper.findAll('[data-test=action-hint]')[0].text()).eq('2 colonies · 1 fleets free');

    await wrapper.findAll('[data-test=action-tile]')[0].trigger('click');
    await wrapper.vm.$nextTick();
    const dialog = document.querySelector('.tm-play-modal');
    expect(dialog).is.not.null;
    expect(dialog?.querySelectorAll('[data-test^=colony-tile-]')).has.length(2);
    expect(dialog?.querySelector('[data-test=colony-picks]')).is.null;

    (dialog?.querySelector('[data-test=colony-tile-Luna]') as HTMLElement).click();
    await wrapper.vm.$nextTick();
    (dialog?.querySelector('[data-primary]') as HTMLElement).click();
    expect(saved).deep.eq({type: 'or', index: 0, response: {type: 'and', responses: [
      {type: 'or', index: 0, response: {type: 'option'}},
      {type: 'colony', colonyName: ColonyName.LUNA},
    ]}});
    expect(quickActions.followUp).is.true;
    quickActions.followUp = false;
    wrapper.unmount();
    home.remove();
  });

  it('shows where each World Government choice takes its global parameter', () => {
    const option = (title: string): PlayerInputModel => ({type: 'option', title, buttonLabel: 'Increase'});
    const playerinput: OrOptionsModel = {
      type: 'or', title: 'Select action for World Government Terraforming', buttonLabel: 'Confirm',
      options: [option('Increase temperature'), option('Increase oxygen'), option('Increase Venus scale')],
    };
    const game = fakeGameModel({phase: Phase.SOLAR, temperature: -2, oxygenLevel: 8, venusScaleLevel: 14});
    const wrapper = mount(ActionMenu, {
      ...globalConfig,
      global: {...globalConfig.global, components: {PlayerInputFactory}},
      props: {playerView: fakePlayerViewModel({game}), playerinput, onsave: () => {}, showsave: true, showtitle: true},
    });
    expect(wrapper.find('[data-test=world-government-note]').exists()).is.true;
    expect(wrapper.findAll('[data-test=action-hint]').map((h) => h.text())).deep.eq(['-2° → 0°', '8% → 9%', '14% → 16%']);
  });
});
