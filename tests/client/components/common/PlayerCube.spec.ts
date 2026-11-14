import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {cubeShades} from '@/client/utils/gameTheme';

describe('PlayerCube', () => {
  it('draws three faces in the player color', () => {
    const wrapper = shallowMount(PlayerCube, {...globalConfig, props: {color: 'red'}});
    const fills = wrapper.findAll('polygon').map((p) => p.attributes('fill'));
    const shades = cubeShades('red');
    expect(fills).deep.eq([shades.top, shades.left, shades.right]);
  });
});
