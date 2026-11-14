import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {afterEach, vi} from 'vitest';
import {globalConfig} from '../getLocalVue';
import ResourceStockpile from '@/client/components/overview/ResourceStockpile.vue';
import {fakePublicPlayerModel} from '../testHelpers';

describe('ResourceStockpile', () => {
  it('shows each resource amount and production', () => {
    const wrapper = shallowMount(ResourceStockpile, {
      ...globalConfig,
      props: {player: fakePublicPlayerModel({megacredits: 42, megacreditProduction: 14, heat: 12, heatProduction: -1})},
    });
    expect(wrapper.findAll('.tm-stock')).has.length(6);
    const mc = wrapper.find('[data-test=stock-megacredits]');
    expect(mc.find('[data-test=amount]').text()).eq('42');
    expect(mc.find('[data-test=production]').text()).eq('+14');
    expect(wrapper.find('[data-test=stock-heat] [data-test=production]').text()).eq('-1');
  });

  it('shows the M€ value of steel only when it differs from the default', () => {
    const plain = shallowMount(ResourceStockpile, {...globalConfig, props: {player: fakePublicPlayerModel()}});
    expect(plain.find('[data-test=stock-steel] .tm-stock-label').text()).not.contains('M€');
    const boosted = shallowMount(ResourceStockpile, {...globalConfig, props: {player: fakePublicPlayerModel({steelValue: 3})}});
    expect(boosted.find('[data-test=stock-steel] .tm-stock-label').text()).contains('3 M€');
  });

  describe('animations', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('counts to a new amount, floats the change, and flashes production', async () => {
      vi.useFakeTimers();
      const wrapper = shallowMount(ResourceStockpile, {
        ...globalConfig,
        props: {player: fakePublicPlayerModel({megacredits: 42, heat: 5, plantProduction: 1})},
      });
      await wrapper.setProps({player: fakePublicPlayerModel({megacredits: 50, heat: 2, plantProduction: 2})});

      const mc = wrapper.find('[data-test=stock-megacredits]');
      expect(mc.find('[data-test=float]').text()).eq('+8');
      expect(mc.find('.tm-stock-flash--up').exists()).is.true;
      expect(wrapper.find('[data-test=stock-heat] [data-test=float]').text()).eq('−3');
      expect(wrapper.find('[data-test=stock-heat] .tm-stock-flash--down').exists()).is.true;
      expect(wrapper.find('[data-test=stock-plants] .tm-stock-prod--up').exists()).is.true;
      expect(wrapper.find('[data-test=stock-steel] .tm-stock-flash').exists()).is.false;
      expect(mc.find('[data-test=amount]').text()).eq('42');

      await vi.advanceTimersByTimeAsync(2000);
      expect(mc.find('[data-test=amount]').text()).eq('50');
      expect(wrapper.findAll('[data-test=float]')).has.length(0);
    });

    it('does not animate when showing a different player', async () => {
      const wrapper = shallowMount(ResourceStockpile, {
        ...globalConfig,
        props: {player: fakePublicPlayerModel({color: 'red', megacredits: 42})},
      });
      await wrapper.setProps({player: fakePublicPlayerModel({color: 'blue', megacredits: 10})});
      expect(wrapper.findAll('[data-test=float]')).has.length(0);
      expect(wrapper.find('[data-test=stock-megacredits] [data-test=amount]').text()).eq('10');
    });
  });
});
