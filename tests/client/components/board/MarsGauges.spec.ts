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

  it('draws no Venus track without Venus', () => {
    const wrapper = shallowMount(MarsGauges, {
      ...globalConfig,
      props: {boardName: BoardName.THARSIS, temperature: -22, oxygen: 9, oceans: 6},
    });
    expect(wrapper.find('[data-test=venus]').exists()).is.false;
    expect(wrapper.attributes('width')).eq('670');
  });

  it('draws the Venus track with its bonuses', () => {
    const wrapper = shallowMount(MarsGauges, {
      ...globalConfig,
      props: {boardName: BoardName.THARSIS, temperature: -22, oxygen: 9, oceans: 6, venus: 14},
    });
    expect(wrapper.attributes('width')).eq('770');
    expect(wrapper.find('[data-test=venus-value]').text()).eq('14%');
    // 0 to 30 in steps of 2.
    const ticks = wrapper.findAll('[data-test=venus-tick]');
    expect(ticks).has.length(16);
    expect(ticks.find((t) => t.classes().includes('mars-gauges-tick--current'))?.text()).eq('14');
    const cells = wrapper.findAll('[data-test=venus-cell]');
    expect(cells).has.length(15);
    expect(cells.filter((c) => c.classes().includes('mars-gauges-venus-cell--on'))).has.length(7);
    const bonuses = wrapper.findAll('[data-test=venus-bonus]');
    expect(bonuses.map((b) => b.find('title').text())).deep.eq(['8%: draw a card', '16%: +1 TR']);
    expect(bonuses.map((b) => b.classes().includes('mars-gauges-bonus--done'))).deep.eq([true, false]);
  });

  it('shows the alternative Venus track bonuses', () => {
    const wrapper = shallowMount(MarsGauges, {
      ...globalConfig,
      props: {boardName: BoardName.THARSIS, temperature: -22, oxygen: 9, oceans: 6, venus: 20, altVenusBoard: true},
    });
    const kinds = wrapper.findAll('[data-test=venus-bonus]').map((b) => b.classes().find((c) => /--(card|tr|standard|wild)$/.test(c)));
    expect(kinds).deep.eq([
      'mars-gauges-bonus--card', 'mars-gauges-bonus--tr',
      ...Array(7).fill('mars-gauges-bonus--standard'),
      'mars-gauges-bonus--wild',
    ]);
  });

  it('extends the Venus track in 1% steps above 30% on Amazonis Planitia', () => {
    const wrapper = shallowMount(MarsGauges, {
      ...globalConfig,
      props: {boardName: BoardName.AMAZONIS_PLANITIA, temperature: -22, oxygen: 9, oceans: 6, venus: 32},
    });
    const ticks = wrapper.findAll('[data-test=venus-tick]').map((t) => t.text());
    expect(ticks.slice(-4)).deep.eq(['30', '31', '32', '33']);
    expect(wrapper.findAll('[data-test=venus-cell]')).has.length(18);
    expect(wrapper.findAll('[data-test=venus-bonus]').map((b) => b.find('title').text())).deep.eq([
      '8%: draw a card', '16%: place a colony', '22%: +1 TR',
    ]);
  });
});
