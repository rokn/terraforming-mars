import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectCard from '@/client/components/SelectCard.vue';
import {fakePlayerViewModel} from './testHelpers';
import {CardName} from '@/common/cards/CardName';

describe('SelectCard', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select a card',
          buttonLabel: 'Save',
          type: 'card',
          cards: [],
          max: 1,
          min: 1,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: false,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('starts with the only card chosen when exactly one must be chosen from one', async () => {
    let saved: unknown;
    const wrapper = shallowMount(SelectCard, {
      ...globalConfig,
      props: {
        playerView: fakePlayerViewModel(),
        playerinput: {
          title: 'Select prelude card to play',
          buttonLabel: 'Play',
          type: 'card',
          cards: [{name: CardName.DONATION, calculatedCost: 0}],
          max: 1,
          min: 1,
          showOnlyInLearnerMode: false,
          selectBlueCardAction: false,
          showOwner: false,
          showSelectAll: false,
        },
        onsave: (out: unknown) => saved = out,
        showsave: true,
        showtitle: true,
      },
    });
    (wrapper.vm as unknown as {saveData: () => void}).saveData();
    expect(saved).to.deep.eq({type: 'card', cards: [CardName.DONATION]});
  });
});
