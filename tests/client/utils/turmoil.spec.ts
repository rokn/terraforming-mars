import {expect} from 'chai';
import {eventsInPlay, partyAgenda, rulingPolicyText} from '@/client/utils/turmoil';
import {PartyName} from '@/common/turmoil/PartyName';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {fakeTurmoilModel} from '../components/testHelpers';

describe('turmoil utils', () => {
  it('reads each party agenda and the ruling policy', () => {
    const turmoil = fakeTurmoilModel();
    expect(partyAgenda(turmoil, PartyName.REDS)).deep.eq({bonusId: 'rb01', policyId: 'rp01'});
    expect(rulingPolicyText(turmoil)).eq('Pay 10 M€ to draw 3 cards');
    expect(rulingPolicyText(fakeTurmoilModel({ruling: undefined}))).is.undefined;
  });

  it('lists the events in play, furthest first', () => {
    expect(eventsInPlay(fakeTurmoilModel({current: undefined}))).deep.eq([
      {stage: 'distant', name: GlobalEventName.PANDEMIC},
      {stage: 'coming', name: GlobalEventName.DIVERSITY},
    ]);
  });
});
