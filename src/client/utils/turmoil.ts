import {PartyName} from '@/common/turmoil/PartyName';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {Agenda, BonusId, PolicyId} from '@/common/turmoil/Types';
import {getAgenda} from '@/client/turmoil/ClientAgendaManifest';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';

/** A party's colour in the in-game theme: `fill` for its band, and `ink` for text drawn on the band. */
export type PartyColors = {fill: string, ink: string};

const PARTY_COLORS: Record<PartyName, PartyColors> = {
  [PartyName.MARS]: {fill: '#C97E23', ink: '#1B0F04'},
  [PartyName.SCIENTISTS]: {fill: '#E9E4DA', ink: '#1E120D'},
  [PartyName.UNITY]: {fill: '#2F8FE0', ink: '#06121F'},
  [PartyName.GREENS]: {fill: '#3BAA3A', ink: '#061405'},
  [PartyName.REDS]: {fill: '#E0524F', ink: '#1E0606'},
  [PartyName.KELVINISTS]: {fill: '#8C7A72', ink: '#140C09'},
};

export function partyColors(party: PartyName): PartyColors {
  return PARTY_COLORS[party];
}

/** The bonus and policy `party` brings when it rules, as this game's agendas set them. */
export function partyAgenda(turmoil: TurmoilModel, party: PartyName): Agenda | undefined {
  const agendas = turmoil.politicalAgendas;
  if (agendas === undefined) {
    return undefined;
  }
  switch (party) {
  case PartyName.MARS:
    return agendas.marsFirst;
  case PartyName.SCIENTISTS:
    return agendas.scientists;
  case PartyName.UNITY:
    return agendas.unity;
  case PartyName.KELVINISTS:
    return agendas.kelvinists;
  case PartyName.REDS:
    return agendas.reds;
  case PartyName.GREENS:
    return agendas.greens;
  }
}

/** The English text of a bonus or policy, to translate. Falls back to the id. */
export function agendaText(id: BonusId | PolicyId): string {
  return getAgenda(id)?.description ?? id;
}

/** The ruling party's policy text, if any party rules. */
export function rulingPolicyText(turmoil: TurmoilModel): string | undefined {
  if (turmoil.ruling === undefined) {
    return undefined;
  }
  const agenda = partyAgenda(turmoil, turmoil.ruling);
  return agenda === undefined ? undefined : agendaText(agenda.policyId);
}

/** The stage of a global event on its way to being resolved. */
export type EventStage = 'distant' | 'coming' | 'current';

/** The global events in play, the furthest first, skipping empty slots. */
export function eventsInPlay(turmoil: TurmoilModel): Array<{stage: EventStage, name: GlobalEventName}> {
  const stages: Array<[EventStage, GlobalEventName | undefined]> = [['distant', turmoil.distant], ['coming', turmoil.coming], ['current', turmoil.current]];
  return stages.flatMap(([stage, name]) => name === undefined ? [] : [{stage, name}]);
}
