import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import SidePanel from '@/client/components/common/SidePanel.vue';

describe('SidePanel', () => {
  it('shows its title and content only while open', async () => {
    const wrapper = mount(SidePanel, {...globalConfig, props: {open: false, title: 'Game log'}, attachTo: document.body, slots: {default: '<p class="content">Hello</p>'}});
    expect(wrapper.find('.tm-sheet').isVisible()).is.false;
    await wrapper.setProps({open: true});
    expect(wrapper.find('.tm-sheet').isVisible()).is.true;
    expect(wrapper.find('h2').text()).eq('Game log');
    expect(wrapper.find('.content').text()).eq('Hello');
  });

  it('emits close from the close button and from Escape while open', async () => {
    const wrapper = mount(SidePanel, {...globalConfig, props: {open: true, title: 'Colonies'}});
    await wrapper.find('[data-test=close]').trigger('click');
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(wrapper.emitted('close')).has.length(2);

    await wrapper.setProps({open: false});
    window.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(wrapper.emitted('close')).has.length(2);
  });

  it('zooms its content when zoomable', async () => {
    const wrapper = mount(SidePanel, {...globalConfig, props: {open: true, title: 'Player boards', zoomable: true, initialZoom: 0.7}});
    expect(wrapper.find('[data-test=zoom-level]').text()).eq('70%');
    await wrapper.find('[data-test=zoom-in]').trigger('click');
    expect(wrapper.find('[data-test=zoom-level]').text()).eq('80%');
    expect(wrapper.find('.tm-sheet-zoom').attributes('style')).contains('zoom: 0.8');
  });
});
