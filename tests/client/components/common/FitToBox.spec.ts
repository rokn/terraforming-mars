import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import FitToBox from '@/client/components/common/FitToBox.vue';

function sizeOf(el: Element, props: Record<string, number>) {
  for (const [key, value] of Object.entries(props)) {
    Object.defineProperty(el, key, {configurable: true, value});
  }
}

describe('FitToBox', () => {
  it('renders its content', () => {
    const wrapper = mount(FitToBox, {...globalConfig, slots: {default: '<div class="board">Mars</div>'}});
    expect(wrapper.find('.fit-to-box-content .board').text()).eq('Mars');
  });

  it('scales content down to fit the box, centres it, and zooms', async () => {
    const wrapper = mount(FitToBox, {...globalConfig, slots: {default: '<div>Mars</div>'}});
    sizeOf(wrapper.find('.fit-to-box').element, {clientWidth: 800, clientHeight: 310});
    sizeOf(wrapper.find('.fit-to-box-content').element, {offsetWidth: 670, offsetHeight: 620});
    (wrapper.vm as InstanceType<typeof FitToBox>).fit();
    expect(wrapper.vm.scale).eq(0.5);
    expect(wrapper.vm.offsetX).eq(233);

    await wrapper.setProps({zoomable: true});
    await wrapper.find('[data-test=zoom-in]').trigger('click');
    expect(wrapper.vm.scale).eq(0.625);
    await wrapper.find('[data-test=zoom-fit]').trigger('click');
    expect(wrapper.vm.scale).eq(0.5);
  });

  it('does not scale past maxScale', () => {
    const wrapper = mount(FitToBox, {...globalConfig, props: {maxScale: 1.2}, slots: {default: '<div>Mars</div>'}});
    sizeOf(wrapper.find('.fit-to-box').element, {clientWidth: 3000, clientHeight: 3000});
    sizeOf(wrapper.find('.fit-to-box-content').element, {offsetWidth: 670, offsetHeight: 620});
    (wrapper.vm as InstanceType<typeof FitToBox>).fit();
    expect(wrapper.vm.scale).eq(1.2);
  });
});
