import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import EventTile from '@/client/components/turmoil/EventTile.vue';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {getGlobalEvent} from '@/client/turmoil/ClientGlobalEventManifest';

describe('EventTile', () => {
  it('shows the stage, name, parties and effect', () => {
    const event = getGlobalEvent(GlobalEventName.SOLAR_FLARE)!;
    const wrapper = mount(EventTile, {...globalConfig, props: {name: GlobalEventName.SOLAR_FLARE, stage: 'current'}});
    expect(wrapper.find('[data-test=event-stage]').text()).eq('Current');
    expect(wrapper.find('[data-test=event-name]').text()).eq('Solar Flare');
    expect(wrapper.findAllComponents(PartyChip).map((c) => c.props('party'))).deep.eq([event.revealedDelegate, event.currentDelegate]);
    expect(wrapper.find('[data-test=event-text]').text()).eq(event.description);
  });

  it('emits select when selectable', async () => {
    const wrapper = mount(EventTile, {...globalConfig, props: {name: GlobalEventName.DIVERSITY, selectable: true}});
    expect(wrapper.find('[data-test=event-stage]').exists()).is.false;
    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).deep.eq([[GlobalEventName.DIVERSITY]]);
  });
});
