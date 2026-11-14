import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import MarsGauges from '@/client/components/board/MarsGauges.vue';
import {BoardName} from '@/common/boards/BoardName';

describe('MarsGauges', () => {
  it('draws the global parameters', () => {
    const wrapper = shallowMount(MarsGauges, {
      ...globalConfig,
      props: {boardName: BoardName.THARSIS, temperature: -8, oxygen: 9, oceans: 6},
    });
    const segments = wrapper.findAll('[data-test=oxygen-segment]');
    expect(segments).has.length(14);
    expect(segments.filter((s) => s.classes().includes('mars-gauges-oxygen--on'))).has.length(9);
    expect(wrapper.find('[data-test=oxygen-value]').text()).eq('9%');
    expect(wrapper.find('[data-test=temperature-value]').text()).eq('−8°');
    expect(wrapper.find('[data-test=oceans-value]').text()).eq('OCEANS 6/9');
    const pips = wrapper.findAll('[data-test=ocean-pip]');
    expect(pips).has.length(9);
    expect(pips.filter((p) => p.classes().includes('mars-gauges-pip--on'))).has.length(6);
  });

  it('labels every temperature step and shows what each bonus gives', () => {
    const wrapper = shallowMount(MarsGauges, {
      ...globalConfig,
      props: {boardName: BoardName.THARSIS, temperature: -22, oxygen: 9, oceans: 6},
    });
    // -30 to +8 in steps of 2.
    expect(wrapper.findAll('[data-test=temperature-tick]')).has.length(20);
    const bonuses = wrapper.findAll('[data-test=bonus]');
    expect(bonuses.map((b) => b.classes().find((c) => /--(heat|ocean|temp)$/.test(c)))).deep.eq([
      'mars-gauges-bonus--temp', 'mars-gauges-bonus--heat', 'mars-gauges-bonus--heat', 'mars-gauges-bonus--ocean',
    ]);
    // Oxygen 9% is past the 8% bonus, -22° is past -24° but not -20°.
    expect(bonuses.map((b) => b.classes().includes('mars-gauges-bonus--done'))).deep.eq([true, true, false, false]);
    expect(bonuses.every((b) => b.find('path').exists())).is.true;
  });
});
