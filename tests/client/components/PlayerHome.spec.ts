import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerHome from '@/client/components/PlayerHome.vue';
import CardSortButtons from '@/client/components/CardSortButtons.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import {fakeGameModel, fakePlayerViewModel, fakePublicPlayerModel} from './testHelpers';
import {useFakeLocalStorage} from './FakeLocalStorage';
import {CardName} from '@/common/cards/CardName';
import raw_settings from '@/genfiles/settings.json';
import WaitingFor from '@/client/components/WaitingFor.vue';
import {Phase} from '@/common/Phase';

describe('PlayerHome', () => {
  useFakeLocalStorage();

  it('mounts without errors', () => {
    const wrapper = shallowMount(PlayerHome, {
      ...globalConfig,
      parentComponent: {
        methods: {
          getVisibilityState: () => true,
          setVisibilityState: () => {},
        },
      },
      props: {
        playerView: fakePlayerViewModel(),
        settings: raw_settings,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('sort buttons sort the hand', async () => {
    // The hand only renders once the player has a tableau.
    const thisPlayer = fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}]});
    const playerView = fakePlayerViewModel({thisPlayer, players: [thisPlayer], cardsInHand: [{name: CardName.ANTS}]});
    const wrapper = shallowMount(PlayerHome, {
      ...globalConfig,
      parentComponent: {
        methods: {
          getVisibilityState: () => true,
          setVisibilityState: () => {},
        },
      },
      props: {
        playerView,
        settings: raw_settings,
      },
    });

    wrapper.findComponent(CardSortButtons).vm.$emit('update:sortOrder', {key: 'vp', reversed: false});
    await wrapper.vm.$nextTick();

    expect(wrapper.findComponent(SortableCards).props('sortOrder')).to.deep.eq({key: 'vp', reversed: false});
  });

  it("B toggles the player's own tableau", async () => {
    const thisPlayer = fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}]});
    const playerView = fakePlayerViewModel({thisPlayer, players: [thisPlayer]});
    const wrapper = shallowMount(PlayerHome, {
      ...globalConfig,
      parentComponent: {
        methods: {
          getVisibilityState: () => false,
          setVisibilityState: () => {},
        },
      },
      props: {
        playerView,
        settings: raw_settings,
      },
    });
    const vm = wrapper.vm as unknown as {showOwnBoard: boolean};
    document.body.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyB', bubbles: true}));
    expect(vm.showOwnBoard).is.true;
    document.body.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyB', ctrlKey: true, bubbles: true}));
    expect(vm.showOwnBoard).is.true;
    document.body.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyB', bubbles: true}));
    expect(vm.showOwnBoard).is.false;
    wrapper.unmount();
  });

  it('Enter presses the main button of the open dialog', async () => {
    const thisPlayer = fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}]});
    const playerView = fakePlayerViewModel({thisPlayer, players: [thisPlayer]});
    const wrapper = shallowMount(PlayerHome, {
      ...globalConfig,
      attachTo: document.body,
      parentComponent: {
        methods: {
          getVisibilityState: () => false,
          setVisibilityState: () => {},
        },
      },
      props: {
        playerView,
        settings: raw_settings,
      },
    });
    const dialog = document.createElement('div');
    dialog.className = 'tm-play-modal';
    dialog.innerHTML = '<button class="btn btn-submit">Select all</button><button class="btn btn-submit" data-primary>Buy</button>';
    wrapper.element.appendChild(dialog);
    let pressed = '';
    dialog.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => pressed = b.textContent ?? ''));

    document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
    expect(pressed).eq('Buy');
    wrapper.unmount();
  });

  it('shows the prelude phase choice in a dialog, and played preludes as their own group', async () => {
    const thisPlayer = fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}, {name: CardName.DONATION}]});
    const playerView = fakePlayerViewModel({
      thisPlayer,
      players: [thisPlayer],
      game: fakeGameModel({phase: Phase.PRELUDES}),
      preludeCardsInHand: [{name: CardName.BIOFUELS}],
      waitingFor: {type: 'card', title: 'Select prelude card to play', buttonLabel: 'Play', cards: [{name: CardName.BIOFUELS}], min: 1, max: 1},
    });
    const wrapper = shallowMount(PlayerHome, {
      ...globalConfig,
      parentComponent: {
        methods: {
          getVisibilityState: () => false,
          setVisibilityState: () => {},
        },
      },
      props: {
        playerView,
        settings: raw_settings,
      },
    });
    const waitingFor = wrapper.findComponent(WaitingFor);
    expect(waitingFor.props('modal')).is.true;
    expect(waitingFor.props('modalTitle')).eq('Play a prelude');
    expect(wrapper.findComponent(SortableCards).props('playable')).deep.eq([CardName.BIOFUELS]);
    const vm = wrapper.vm as unknown as {preludeTableauCards: Array<{name: CardName}>, automatedTableauCount: number};
    expect(vm.preludeTableauCards.map((c) => c.name)).deep.eq([CardName.DONATION]);
    expect(vm.automatedTableauCount).eq(0);

    // Closed to look at the board, it can be opened again.
    waitingFor.vm.$emit('dismiss');
    await wrapper.vm.$nextTick();
    expect(waitingFor.props('modal')).is.false;
    await wrapper.find('[data-test=prelude-reopen]').trigger('click');
    expect(waitingFor.props('modal')).is.true;
  });
});
