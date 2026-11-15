import {mount, shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import SelectColony from '@/client/components/SelectColony.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectColonyModel} from '@/common/models/PlayerInputModel';
import {ColonyName} from '@/common/colonies/ColonyName';
import {simpleColonyModel} from '@/common/models/ColonyModel';
import {SelectColonyResponse} from '@/common/inputs/InputResponse';
import {colonyPick} from '@/client/utils/centerView';

function input(names: Array<ColonyName>, buttonLabel = 'Save'): SelectColonyModel {
  return {title: 'Select a colony', buttonLabel, type: 'colony', coloniesModel: names.map(simpleColonyModel)};
}

function mountSelect(playerinput: SelectColonyModel, compact: boolean, onsave: (out: SelectColonyResponse) => void = () => {}) {
  return mount(SelectColony, {
    ...globalConfig,
    global: {...globalConfig.global, provide: {compactColonies: () => compact}},
    props: {playerView: {} as PlayerViewModel, playerinput, onsave, showsave: true, showtitle: true},
  });
}

describe('SelectColony', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(SelectColony, {
      ...globalConfig,
      props: {
        playerView: {} as PlayerViewModel,
        playerinput: input([]),
        onsave: () => {},
        showsave: true,
        showtitle: true,
      },
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('shows clickable tiles, and saves the one clicked', async () => {
    let saved: SelectColonyResponse | undefined;
    const wrapper = mountSelect(input([ColonyName.CERES, ColonyName.LUNA]), false, (out) => saved = out);
    expect(wrapper.findAll('[data-test^=colony-tile-]')).has.length(2);
    expect(wrapper.find('[data-test=colony-picks]').exists()).is.false;
    expect(wrapper.find('[data-primary]').attributes('disabled')).is.not.undefined;

    await wrapper.find('[data-test=colony-tile-Luna]').trigger('click');
    await wrapper.find('[data-primary]').trigger('click');
    expect(saved).deep.eq({type: 'colony', colonyName: ColonyName.LUNA});
    expect(colonyPick.offered).is.empty;
  });

  it('starts with a single tile chosen', () => {
    const wrapper = mountSelect(input([ColonyName.EUROPA], 'Build'), false);
    expect(wrapper.find('[data-test=colony-tile-Europa]').classes()).contains('tm-colony-tile--selected');
  });

  it('in the operations panel, lists names and shares the choice with the Colonies view', async () => {
    let saved: SelectColonyResponse | undefined;
    const wrapper = mountSelect(input([ColonyName.CERES, ColonyName.LUNA], 'Build'), true, (out) => saved = out);
    expect(wrapper.find('[data-test=colony-choices]').exists()).is.false;
    expect(wrapper.find('[data-test=colony-picks]').text()).contains('Luna');
    expect(colonyPick.offered).deep.eq([ColonyName.CERES, ColonyName.LUNA]);
    expect(colonyPick.build).is.true;

    // Picked on a tile in the Colonies view.
    colonyPick.selected = ColonyName.CERES;
    await wrapper.vm.$nextTick();
    await wrapper.find('[data-primary]').trigger('click');
    expect(saved).deep.eq({type: 'colony', colonyName: ColonyName.CERES});

    wrapper.unmount();
    expect(colonyPick.offered).is.empty;
    expect(colonyPick.selected).is.undefined;
  });
});
