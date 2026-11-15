import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import CenterViewTabs from '@/client/components/common/CenterViewTabs.vue';

describe('CenterViewTabs', () => {
  it('is hidden with a single view', () => {
    const wrapper = mount(CenterViewTabs, {...globalConfig, props: {views: ['mars'], modelValue: 'mars'}});
    expect(wrapper.find('[role=tablist]').exists()).is.false;
  });

  it('marks the shown view and emits the chosen one', async () => {
    const wrapper = mount(CenterViewTabs, {...globalConfig, props: {views: ['mars', 'colonies'], modelValue: 'mars'}});
    expect(wrapper.find('[data-test=view-tab-mars]').attributes('aria-selected')).eq('true');
    expect(wrapper.find('[data-test=view-tab-colonies]').text()).contains('C');
    await wrapper.find('[data-test=view-tab-colonies]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).deep.eq([['colonies']]);
  });
});
