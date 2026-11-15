import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import OtherPlayer from '@/client/components/OtherPlayer.vue';
import {fakePublicPlayerModel} from './testHelpers';
import {CardName} from '@/common/cards/CardName';

describe('OtherPlayer', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(OtherPlayer, {
      ...globalConfig,
      global: {
        ...globalConfig.global,
        mixins: [{
          methods: {
            getVisibilityState: () => true,
            setVisibilityState: () => {},
          },
        }],
      },
      props: {
        player: fakePublicPlayerModel(),
        playerIndex: 0,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows played preludes on their own, not in the automated stack', () => {
    const wrapper = shallowMount(OtherPlayer, {
      ...globalConfig,
      global: {
        ...globalConfig.global,
        mixins: [{
          methods: {
            getVisibilityState: () => true,
            setVisibilityState: () => {},
          },
        }],
      },
      props: {
        player: fakePublicPlayerModel({tableau: [{name: CardName.ECOLINE}, {name: CardName.DONATION}, {name: CardName.ANTS}]}),
        playerIndex: 0,
      },
    });
    const preludes = wrapper.findAll('[data-test=tableau-prelude]');
    expect(preludes).has.length(1);
    expect(preludes[0].findComponent({name: 'Card'}).props('card')).deep.eq({name: CardName.DONATION});
  });
});
