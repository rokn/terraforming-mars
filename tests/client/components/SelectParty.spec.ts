import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectParty from '@/client/components/SelectParty.vue';
import {fakeGameModel, fakePlayerViewModel, fakeTurmoilModel} from './testHelpers';
import PartyTile from '@/client/components/turmoil/PartyTile.vue';
import {mount} from '@vue/test-utils';
import {partyPick} from '@/client/utils/centerView';
import AppButton from '@/client/components/common/AppButton.vue';
import {PartyName} from '@/common/turmoil/PartyName';

describe('SelectParty', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectParty, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select a party',
          buttonLabel: 'Save',
          type: 'party',
          parties: [],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('button is disabled until a party is selected', async () => {
    const wrapper = shallowMount(SelectParty, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select a party',
          buttonLabel: 'Save',
          type: 'party',
          parties: [PartyName.MARS, PartyName.GREENS],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.findComponent(AppButton).props('disabled')).is.true;

    await wrapper.setData({selectedParty: PartyName.GREENS});

    expect(wrapper.findComponent(AppButton).props('disabled')).is.false;
  });

  const input = {title: 'Send a delegate', buttonLabel: 'Send', type: 'party' as const, parties: [PartyName.MARS, PartyName.GREENS]};
  const playerView = fakePlayerViewModel({game: fakeGameModel({turmoil: fakeTurmoilModel()})});

  it('shows the six parties, the offered ones selectable', async () => {
    let saved: unknown;
    const wrapper = mount(SelectParty, {...globalConfig, props: {playerView, playerinput: input, onsave: (out: unknown) => saved = out, showsave: true}});
    const tiles = wrapper.findAllComponents(PartyTile);
    expect(tiles.map((t) => t.props('selectable'))).deep.eq([true, false, false, true, false, false]);
    await tiles[3].trigger('click');
    await wrapper.findComponent(AppButton).trigger('click');
    expect(saved).deep.eq({type: 'party', partyName: PartyName.GREENS});
  });

  it('lists the names in the operations panel and shares the pick with the Turmoil view', async () => {
    const wrapper = mount(SelectParty, {
      ...globalConfig,
      global: {...globalConfig.global, provide: {compactTiles: () => true}},
      props: {playerView, playerinput: input, onsave: () => {}, showsave: true},
    });
    expect(wrapper.findAllComponents(PartyTile)).has.length(0);
    expect(wrapper.findAll('[data-test=party-picks] input')).has.length(2);
    expect(partyPick.offered).deep.eq([PartyName.MARS, PartyName.GREENS]);
    partyPick.selected = PartyName.MARS;
    await wrapper.vm.$nextTick();
    expect(wrapper.findComponent(AppButton).props('disabled')).is.false;
    wrapper.unmount();
    expect(partyPick.offered).deep.eq([]);
  });
});
