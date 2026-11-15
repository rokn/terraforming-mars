import {mount, shallowMount} from '@vue/test-utils';
import {fakePublicPlayerModel} from './testHelpers';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectDelegate from '@/client/components/SelectDelegate.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';

describe('SelectDelegate', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectDelegate, {
      ...globalConfig,
      props: {
        playerView: {players: []} as unknown as PlayerViewModel,
        playerinput: {
          title: 'Select a delegate',
          buttonLabel: 'Save',
          type: 'delegate',
          players: ['NEUTRAL'],
        },
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('lists neutral and player delegates, and saves the one picked', async () => {
    let saved: unknown;
    const wrapper = mount(SelectDelegate, {
      ...globalConfig,
      props: {
        playerView: {players: [fakePublicPlayerModel({color: 'blue', name: 'Ada'})]} as unknown as PlayerViewModel,
        playerinput: {title: 'Select a delegate', buttonLabel: 'Remove', type: 'delegate', players: ['NEUTRAL', 'blue']},
        onsave: (out: unknown) => saved = out,
        showsave: true,
      },
    });
    const picks = wrapper.findAll('[data-test=delegate-pick]');
    expect(picks.map((p) => p.text())).deep.eq(['Neutral', 'Ada']);
    await picks[1].find('input').setValue(true);
    await wrapper.find('[data-primary]').trigger('click');
    expect(saved).deep.eq({type: 'delegate', player: 'blue'});
  });
});
