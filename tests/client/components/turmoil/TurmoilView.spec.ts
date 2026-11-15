import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import TurmoilView from '@/client/components/turmoil/TurmoilView.vue';
import PartyTile from '@/client/components/turmoil/PartyTile.vue';
import EventTile from '@/client/components/turmoil/EventTile.vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {fakePublicPlayerModel, fakeTurmoilModel} from '../testHelpers';

const players = [
  fakePublicPlayerModel({color: 'blue', name: 'Ada', influence: 2}),
  fakePublicPlayerModel({color: 'red', name: 'Mira', influence: 0}),
];

describe('TurmoilView', () => {
  it('shows the events, the parties and each player\'s reserve and influence', () => {
    const wrapper = mount(TurmoilView, {...globalConfig, props: {turmoil: fakeTurmoilModel(), players}});
    expect(wrapper.findAllComponents(EventTile).map((e) => e.props('stage'))).deep.eq(['distant', 'coming', 'current']);
    const parties = wrapper.findAllComponents(PartyTile);
    expect(parties).has.length(6);
    expect(parties.filter((p) => p.props('ruling')).map((p) => p.props('party').name)).deep.eq([PartyName.SCIENTISTS]);
    expect(parties.filter((p) => p.props('dominant')).map((p) => p.props('party').name)).deep.eq([PartyName.MARS]);
    expect(wrapper.find('[data-test=chairman]').text()).contains('Ada');
    expect(wrapper.findAll('[data-test=reserve]').map((e) => e.text())).deep.eq(['3', '4+1']);
    expect(wrapper.findAll('[data-test=influence]').map((e) => e.text())).deep.eq(['2', '0']);
    expect(wrapper.find('[data-test=agenda-style]').exists()).is.false;
  });

  it('lets the offered parties be picked, and dims the rest', async () => {
    const wrapper = mount(TurmoilView, {...globalConfig, props: {turmoil: fakeTurmoilModel(), players, selectable: [PartyName.UNITY]}});
    const parties = wrapper.findAllComponents(PartyTile);
    expect(parties.filter((p) => p.props('dimmed'))).has.length(5);
    expect(wrapper.find('[data-test=turmoil-pick]').exists()).is.true;
    await parties[2].trigger('click');
    expect(wrapper.emitted('select')).deep.eq([[PartyName.UNITY]]);
  });

  it('notes Political Agendas', () => {
    const wrapper = mount(TurmoilView, {...globalConfig, props: {turmoil: fakeTurmoilModel(), players, agendaStyle: 'Chairman'}});
    expect(wrapper.find('[data-test=agenda-style]').exists()).is.true;
  });
});
