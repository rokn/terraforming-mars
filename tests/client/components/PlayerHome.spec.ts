import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import PlayerHome from '@/client/components/PlayerHome.vue';
import CardSortButtons from '@/client/components/CardSortButtons.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import {fakeGameModel, fakePlayerViewModel, fakePublicPlayerModel, fakeTurmoilModel} from './testHelpers';
import TurmoilView from '@/client/components/turmoil/TurmoilView.vue';
import PoliticsCard from '@/client/components/turmoil/PoliticsCard.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {useFakeLocalStorage} from './FakeLocalStorage';
import {CardName} from '@/common/cards/CardName';
import raw_settings from '@/genfiles/settings.json';
import WaitingFor from '@/client/components/WaitingFor.vue';
import {Phase} from '@/common/Phase';
import ColoniesView from '@/client/components/colonies/ColoniesView.vue';
import CenterViewTabs from '@/client/components/common/CenterViewTabs.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {loadCenterView, saveCenterView} from '@/client/utils/centerView';

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
    await wrapper.find('[data-test=dialog-reopen]').trigger('click');
    expect(waitingFor.props('modal')).is.true;
  });

  describe('Colonies', () => {
    function mountHome(waitingFor?: PlayerInputModel) {
      const thisPlayer = fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}]});
      const playerView = fakePlayerViewModel({
        thisPlayer,
        players: [thisPlayer],
        game: fakeGameModel({colonies: [simpleColonyModel(ColonyName.LUNA)]}),
        waitingFor,
      });
      return shallowMount(PlayerHome, {
        ...globalConfig,
        parentComponent: {
          methods: {
            getVisibilityState: () => false,
            setVisibilityState: () => {},
          },
        },
        props: {playerView, settings: raw_settings},
      });
    }
    const buildColony: PlayerInputModel = {type: 'colony', title: 'Select where to build a colony', buttonLabel: 'Build', coloniesModel: [simpleColonyModel(ColonyName.LUNA)]};

    it('switches the centre stage with C and M, and remembers the choice', async () => {
      const wrapper = mountHome();
      expect(wrapper.findComponent(CenterViewTabs).props('views')).deep.eq(['mars', 'colonies']);
      expect(wrapper.findComponent(ColoniesView).exists()).is.false;

      document.body.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyC', bubbles: true}));
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(ColoniesView).exists()).is.true;
      expect(loadCenterView()).eq('colonies');

      document.body.dispatchEvent(new KeyboardEvent('keydown', {code: 'KeyM', bubbles: true}));
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(ColoniesView).exists()).is.false;
      wrapper.unmount();
    });

    it('opens a colony choice in a dialog, and shows the Colonies view once it is closed', async () => {
      const wrapper = mountHome(buildColony);
      const waitingFor = wrapper.findComponent(WaitingFor);
      expect(waitingFor.props('modal')).is.true;
      expect(wrapper.findComponent(ColoniesView).exists()).is.false;

      waitingFor.vm.$emit('dismiss');
      await wrapper.vm.$nextTick();
      expect(waitingFor.props('modal')).is.false;
      expect(wrapper.findComponent(ColoniesView).exists()).is.true;
      expect(wrapper.find('[data-test=dialog-reopen]').text()).eq('Show colony tiles');
      wrapper.unmount();
    });

    it('shows Mars when a space must be picked', async () => {
      saveCenterView('colonies');
      const wrapper = mountHome({type: 'space', title: 'Select space for ocean tile', buttonLabel: 'OK', spaces: []});
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(ColoniesView).exists()).is.false;
      wrapper.unmount();
    });
  });

  describe('Turmoil', () => {
    function mountHome(waitingFor?: PlayerInputModel) {
      const thisPlayer = fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}]});
      const playerView = fakePlayerViewModel({
        thisPlayer,
        players: [thisPlayer],
        game: fakeGameModel({turmoil: fakeTurmoilModel()}),
        waitingFor,
      });
      return shallowMount(PlayerHome, {
        ...globalConfig,
        parentComponent: {
          methods: {
            getVisibilityState: () => false,
            setVisibilityState: () => {},
          },
        },
        props: {playerView, settings: raw_settings},
      });
    }

    it('keeps Turmoil out of the map: a Politics card opens it as a centre view', async () => {
      const wrapper = mountHome();
      expect(wrapper.findComponent(Sidebar).exists()).is.false;
      expect(wrapper.findComponent(CenterViewTabs).props('views')).deep.eq(['mars', 'turmoil']);
      expect(wrapper.findComponent(TurmoilView).exists()).is.false;

      wrapper.findComponent(PoliticsCard).vm.$emit('open');
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(TurmoilView).exists()).is.true;
      expect(loadCenterView()).eq('turmoil');
      wrapper.unmount();
    });

    it('opens a party choice in a dialog, and shows the Turmoil view once it is closed', async () => {
      const wrapper = mountHome({type: 'party', title: 'Select where to send a delegate', buttonLabel: 'Send delegate', parties: [PartyName.REDS]});
      const waitingFor = wrapper.findComponent(WaitingFor);
      expect(waitingFor.props('modal')).is.true;
      expect(wrapper.findComponent(TurmoilView).exists()).is.false;

      waitingFor.vm.$emit('dismiss');
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(TurmoilView).exists()).is.true;
      expect(wrapper.find('[data-test=dialog-reopen]').text()).eq('Show parties');
      wrapper.unmount();
    });

    it('shows the parties behind a dialog that asks for a delegate', async () => {
      const wrapper = mountHome({type: 'delegate', title: 'Select a delegate to remove', buttonLabel: 'Remove', players: ['NEUTRAL']});
      await wrapper.vm.$nextTick();
      expect(wrapper.findComponent(WaitingFor).props('modal')).is.true;
      expect(wrapper.findComponent(TurmoilView).exists()).is.true;
      wrapper.unmount();
    });
  });
});
