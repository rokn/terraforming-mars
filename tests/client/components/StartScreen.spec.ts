import {shallowMount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import StartScreen from '@/client/components/StartScreen.vue';
import LanguageSwitcher from '@/client/components/LanguageSwitcher.vue';
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import {DISCORD_INVITE} from '@/common/constants';

describe('StartScreen', () => {
  it('mounts without errors', () => {
    const wrapper = shallowMount(StartScreen, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('makes New game the primary action', () => {
    const wrapper = shallowMount(StartScreen, {...globalConfig});
    const newGame = wrapper.get('a.start-screen-link--new-game');
    expect(newGame.attributes('href')).eq('new-game');
    expect(newGame.attributes('target')).is.undefined;
    expect(newGame.classes()).contains('tm-home-new-game');
  });

  it('shows the secondary links as tiles that open in a new tab', () => {
    const wrapper = shallowMount(StartScreen, {...globalConfig});
    const tiles = wrapper.findAll('a.tm-home-tile');
    expect(tiles.map((t) => t.attributes('href'))).deep.eq([
      'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks',
      'cards',
      'https://boardgamegeek.com/boardgame/167791/terraforming-mars',
      'https://github.com/terraforming-mars/terraforming-mars#README',
      'https://github.com/terraforming-mars/terraforming-mars/wiki/Changelog',
      DISCORD_INVITE,
    ]);
    for (const tile of tiles) {
      expect(tile.attributes('target')).eq('_blank');
      expect(tile.find('.tm-home-tile-name').text()).not.eq('');
      expect(tile.find('.tm-home-tile-desc').text()).not.eq('');
      expect(tile.find('svg').exists()).is.true;
    }
  });

  it('keeps the language and preferences controls and the source link', () => {
    const wrapper = shallowMount(StartScreen, {...globalConfig});
    expect(wrapper.findComponent(LanguageSwitcher).exists()).is.true;
    expect(wrapper.findComponent(LanguageIcon).exists()).is.true;
    expect(wrapper.findComponent(PreferencesIcon).exists()).is.true;
    expect(wrapper.get('.source-code-text').attributes('href')).eq('https://github.com/terraforming-mars/terraforming-mars');
    expect(wrapper.find('.start-screen-version').exists()).is.true;
  });

  it('uses the device width while mounted', () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=1260');
    document.head.appendChild(meta);
    try {
      const wrapper = shallowMount(StartScreen, {...globalConfig});
      expect(meta.getAttribute('content')).contains('width=device-width');
      wrapper.unmount();
      expect(meta.getAttribute('content')).eq('width=1260');
    } finally {
      meta.remove();
    }
  });
});
