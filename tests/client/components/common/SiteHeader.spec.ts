import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import SiteHeader from '@/client/components/common/SiteHeader.vue';

describe('SiteHeader', () => {
  it('links home, to a new game and to the cards list', () => {
    const wrapper = mount(SiteHeader, {...globalConfig});
    expect(wrapper.get('.tm-site-brand').attributes('href')).eq('.');
    expect(wrapper.findAll('.tm-site-nav-link').map((link) => link.attributes('href'))).deep.eq(['.', 'new-game', 'cards']);
    expect(wrapper.get('[data-test="nav-cards"]').attributes('target')).eq('_blank');
  });

  it('highlights the active page', () => {
    const wrapper = mount(SiteHeader, {...globalConfig, props: {active: 'new-game'}});
    const active = wrapper.findAll('.tm-site-nav-link--active');
    expect(active).has.length(1);
    expect(active[0].attributes('data-test')).eq('nav-new-game');
    expect(active[0].attributes('aria-current')).eq('page');
  });

  it('shows slotted controls', () => {
    const wrapper = mount(SiteHeader, {...globalConfig, slots: {default: '<button class="extra">x</button>'}});
    expect(wrapper.find('.tm-site-header-extra .extra').exists()).is.true;
    expect(mount(SiteHeader, {...globalConfig}).find('.tm-site-header-extra').exists()).is.false;
  });
});
