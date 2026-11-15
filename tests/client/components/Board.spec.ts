import {shallowMount} from '@vue/test-utils';
import {globalConfig} from './getLocalVue';
import {expect} from 'chai';
import Board from '@/client/components/Board.vue';
import MarsGauges from '@/client/components/board/MarsGauges.vue';
import BoardSpace from '@/client/components/BoardSpace.vue';
import {SpaceModel} from '@/common/models/SpaceModel';
import {SpaceType} from '@/common/boards/SpaceType';
import {DEFAULT_EXPANSIONS} from '@/common/cards/GameModule';
import {BoardName} from '@/common/boards/BoardName';
import {SpaceName} from '@/common/boards/SpaceName';
import {TileType} from '@/common/TileType';

const spaces: SpaceModel[] = [
  {
    id: 'c01',
    bonus: [],
    spaceType: SpaceType.COLONY,
    color: undefined,
    highlight: undefined,
    tileType: undefined,
  },
  {
    id: 'c02',
    bonus: [],
    spaceType: SpaceType.COLONY,
    color: undefined,
    highlight: undefined,
    tileType: undefined,
  },
  {
    id: 'c69',
    bonus: [],
    spaceType: SpaceType.COLONY,
    color: undefined,
    highlight: undefined,
    tileType: undefined,
  },
  {
    id: '04',
    bonus: [],
    spaceType: SpaceType.OCEAN,
    color: undefined,
    highlight: undefined,
    tileType: undefined,
  },
];


describe('Board', () => {
  it('has visible tiles on the board', () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, tileView: 'hide', venusScaleLevel: 0, boardName: BoardName.THARSIS},
    });

    const boardSpacesWrappers = wrapper.findAllComponents(BoardSpace).filter((wrapper) => {
      return wrapper.attributes('data-test') === 'board-space';
    });

    expect(
      boardSpacesWrappers.every((wrapper) => wrapper.props('tileView') === 'hide'),
    ).to.be.true;
  });

  it('has hidden tiles on the board', () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, tileView: 'show', venusScaleLevel: 0, boardName: BoardName.THARSIS},
    });

    const boardSpacesWrappers = wrapper.findAllComponents(BoardSpace).filter((wrapper) => {
      return wrapper.attributes('data-test') === 'board-space';
    });

    expect(
      boardSpacesWrappers.every((wrapper) => wrapper.props('tileView') === 'show'),
    ).to.be.true;
  });

  it('emits toggleTileView on toggle button click', async () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, venusScaleLevel: 0, boardName: BoardName.THARSIS},
    });

    await wrapper.find('[data-test=hide-tiles-button]').trigger('click');
    expect(wrapper.emitted('toggleTileView')?.length).to.be.eq(1);
  });

  it('renders "show tiles" in toggle button if tiles are hidden', () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, tileView: 'show', venusScaleLevel: 0, boardName: BoardName.THARSIS},
    });

    expect(wrapper.find('[data-test=hide-tiles-button]').text()).to.be.eq('show tiles');
  });

  it('renders "hide tiles" in toggle button if tiles are visible', () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, tileView: 'hide', venusScaleLevel: 0, boardName: BoardName.THARSIS},
    });

    expect(wrapper.find('[data-test=hide-tiles-button]').text()).to.be.eq('hide tiles');
  });

  it('updates off-Mars spaces when the spaces change', async () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, venusScaleLevel: 0, boardName: BoardName.THARSIS},
    });

    const updated = spaces.map((s) => s.id === SpaceName.GANYMEDE_COLONY ? {...s, tileType: TileType.CITY} : s);
    await wrapper.setProps({spaces: updated});

    const ganymede = wrapper.findAllComponents(BoardSpace).find((w) => w.props('text') === 'Ganymede Colony');
    expect(ganymede?.props('space').tileType).to.eq(TileType.CITY);
  });

  it('draws Venus with the other gauges instead of the board image', () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: {...DEFAULT_EXPANSIONS, venus: true}, venusScaleLevel: 14, altVenusBoard: true, boardName: BoardName.THARSIS},
    });
    const gauges = wrapper.findComponent(MarsGauges);
    expect(gauges.props('venus')).eq(14);
    expect(gauges.props('altVenusBoard')).is.true;
    expect(wrapper.classes()).contains('board-cont--venus');
    expect(wrapper.find('.global-numbers-venus').exists()).is.false;
    expect(wrapper.find('.global-alt-venus').exists()).is.false;
  });

  it('leaves Venus out of the gauges without Venus', () => {
    const wrapper = shallowMount(Board, {
      ...globalConfig,
      props: {spaces, expansions: DEFAULT_EXPANSIONS, venusScaleLevel: 0, altVenusBoard: true, boardName: BoardName.THARSIS},
    });
    const gauges = wrapper.findComponent(MarsGauges);
    expect(gauges.props('venus')).is.undefined;
    expect(gauges.props('altVenusBoard')).is.false;
    expect(wrapper.classes()).not.contains('board-cont--venus');
  });
});
