import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from './getLocalVue';
import MilestonesAwardsPanel from '@/client/components/MilestonesAwardsPanel.vue';
import {fakePublicPlayerModel} from './testHelpers';
import {ClaimedMilestoneModel} from '@/common/models/ClaimedMilestoneModel';
import {FundedAwardModel} from '@/common/models/FundedAwardModel';

describe('MilestonesAwardsPanel', () => {
  const players = [fakePublicPlayerModel({color: 'blue', name: 'Ada'}), fakePublicPlayerModel({color: 'red', name: 'Mira'})];
  const milestones: Array<ClaimedMilestoneModel> = [
    {name: 'Terraformer', playerName: undefined, color: undefined, scores: [{color: 'blue', score: 38, claimable: true}, {color: 'red', score: 30, claimable: false}]},
    {name: 'Gardener', playerName: 'Mira', color: 'red', scores: [{color: 'blue', score: 1, claimable: false}, {color: 'red', score: 3, claimable: false}]},
    {name: 'Mayor', playerName: undefined, color: undefined, scores: [{color: 'blue', score: 1, claimable: false}, {color: 'red', score: 1, claimable: false}]},
  ];
  const awards: Array<FundedAwardModel> = [
    {name: 'Banker', playerName: 'Ada', color: 'blue', scores: [{color: 'blue', score: 14}, {color: 'red', score: 9}]},
    {name: 'Thermalist', playerName: undefined, color: undefined, scores: [{color: 'blue', score: 12}, {color: 'red', score: 12}]},
    {name: 'Miner', playerName: undefined, color: undefined, scores: [{color: 'blue', score: 0}, {color: 'red', score: 0}]},
  ];

  function render() {
    return mount(MilestonesAwardsPanel, {...globalConfig, props: {milestones, awards, players, myColor: 'blue'}});
  }

  it('summarizes milestones', () => {
    const wrapper = render();
    expect(wrapper.find('[data-test=milestones-caption]').text()).contains('1/3');
    const rows = wrapper.findAll('[data-test=milestone]');
    expect(rows[0].classes()).contains('tm-ma-row--hot');
    expect(rows[0].text()).contains('You qualify');
    expect(rows[1].text()).contains('Mira');
    expect(rows[2].classes()).not.contains('tm-ma-row--hot');
  });

  it('summarizes awards', () => {
    const wrapper = render();
    expect(wrapper.find('[data-test=awards-caption]').text()).contains('14 M€');
    const rows = wrapper.findAll('[data-test=award]');
    expect(rows[0].text()).contains('Funded');
    expect(rows[0].text()).contains('You leads · 14');
    expect(rows[1].text()).contains('Tied · 12');
    expect(rows[2].text()).contains('—');
  });
});
