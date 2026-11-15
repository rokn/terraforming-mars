<template>
  <div class="tm-turmoil-view" :class="{'tm-turmoil-view--picking': picking}">
    <div class="tm-politics-bar" data-test="politics-bar">
      <span class="tm-politics-item" data-test="chairman">
        <span class="tm-politics-key" v-i18n>Chairman</span>
        <template v-if="turmoil.chairman !== undefined">
          <DelegateIcon :color="turmoil.chairman" :size="15" />
          <span v-if="turmoil.chairman === 'neutral'" class="tm-politics-name" v-i18n>Neutral</span>
          <span v-else class="tm-politics-name">{{ nameOf(turmoil.chairman) }}</span>
        </template>
        <span v-else class="tm-politics-name">—</span>
      </span>
      <span class="tm-politics-item" data-test="lobby">
        <span class="tm-politics-key" v-i18n>Lobby</span>
        <DelegateIcon v-for="color in turmoil.lobby" :key="color" :color="color" :size="15" />
        <span v-if="turmoil.lobby.length === 0" class="tm-politics-name" v-i18n>empty</span>
      </span>
      <span v-if="policyUsers.length > 0" class="tm-politics-item" data-test="policy-users">
        <span class="tm-politics-key" v-i18n>Policy used</span>
        <PlayerCube v-for="color in policyUsers" :key="color" :color="color" :size="12" />
      </span>
      <span v-if="agendaStyle !== 'Standard'" class="tm-politics-item" data-test="agenda-style">
        <span class="tm-politics-key" v-i18n>Agendas</span>
        <span class="tm-politics-name" v-i18n>{{ agendaStyle === 'Chairman' ? 'Set by each new chairman' : 'Random for the game' }}</span>
      </span>
      <span v-if="picking" class="tm-fleets-pick" data-test="turmoil-pick" v-i18n>Click a highlighted party to choose it</span>
      <span class="tm-politics-players">
        <span v-for="player in players" :key="player.color" class="tm-politics-player" data-test="politics-player">
          <PlayerCube :color="player.color" :size="13" />
          <span class="tm-politics-name">{{ player.name }}</span>
          <span class="tm-politics-stat" :title="$t('Delegates in reserve')" data-test="reserve">
            <DelegateIcon :color="player.color" :size="13" />{{ reserveOf(player.color) }}<span v-if="turmoil.lobby.includes(player.color)" class="tm-politics-lobby" :title="$t('Delegate in the lobby')">+1</span>
          </span>
          <span class="tm-politics-stat" :title="$t('Influence')" data-test="influence">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3 7h7l-5.5 4.5 2 7.5-6.5-4.5L5.5 21l2-7.5L2 9h7z" /></svg>{{ player.influence }}
          </span>
        </span>
        <span class="tm-politics-player tm-politics-player--neutral" :title="$t('Neutral delegates in reserve')">
          <DelegateIcon color="neutral" :size="13" />
          <span class="tm-politics-name" v-i18n>Neutral</span>
          <span class="tm-politics-stat">{{ reserveOf('neutral') }}</span>
        </span>
      </span>
    </div>
    <FitToBox class="tm-turmoil-fit" zoomable :maxScale="1.15">
      <div class="tm-turmoil-board">
        <section class="tm-turmoil-section" :aria-label="$t('Global events')">
          <h3 class="tm-turmoil-heading"><span v-i18n>Global events</span> <span class="tm-section-caption" v-i18n>Distant → coming → current</span></h3>
          <div class="tm-turmoil-events">
            <template v-for="(event, idx) in events" :key="event.stage">
              <span v-if="idx > 0" class="tm-turmoil-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square"><path d="M4 12h15M13 6l6 6-6 6" /></svg>
              </span>
              <EventTile :name="event.name" :stage="event.stage" />
            </template>
            <span v-if="events.length === 0" class="tm-empty" v-i18n>No global events</span>
          </div>
        </section>
        <section class="tm-turmoil-section" :aria-label="$t('Parties')">
          <h3 class="tm-turmoil-heading"><span v-i18n>Parties</span> <span class="tm-section-caption" v-i18n>The dominant party rules next generation; its leader becomes chairman</span></h3>
          <div class="tm-turmoil-parties">
            <PartyTile v-for="party in turmoil.parties" :key="party.name"
              :party="party"
              :agenda="agendaOf(party.name)"
              :ruling="party.name === turmoil.ruling"
              :dominant="party.name === turmoil.dominant"
              :selectable="selectable.includes(party.name)"
              :selected="selected === party.name"
              :dimmed="picking && !selectable.includes(party.name)"
              @select="$emit('select', $event)" />
          </div>
        </section>
      </div>
    </FitToBox>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import FitToBox from '@/client/components/common/FitToBox.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';
import PartyTile from '@/client/components/turmoil/PartyTile.vue';
import EventTile from '@/client/components/turmoil/EventTile.vue';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {Agenda, AgendaStyle} from '@/common/turmoil/Types';
import {Color} from '@/common/Color';
import {EventStage, eventsInPlay, partyAgenda} from '@/client/utils/turmoil';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';

/**
 * The Turmoil centre view: a line with the chairman, the lobby and each player's reserve and influence,
 * then the global events (distant, coming, current) and the six parties, fitted to the panel.
 *
 * Parties named in `selectable` can be clicked, which emits `select` with the party's name.
 */
export default defineComponent({
  name: 'TurmoilView',
  props: {
    turmoil: {
      type: Object as () => TurmoilModel,
      required: true,
    },
    players: {
      type: Array as () => ReadonlyArray<PublicPlayerModel>,
      required: true,
    },
    agendaStyle: {
      type: String as () => AgendaStyle,
      default: 'Standard',
    },
    selectable: {
      type: Array as () => ReadonlyArray<PartyName>,
      default: () => [],
    },
    selected: {
      type: String as () => PartyName | undefined,
      default: undefined,
    },
  },
  emits: ['select'],
  components: {
    FitToBox,
    PlayerCube,
    DelegateIcon,
    PartyTile,
    EventTile,
  },
  computed: {
    picking(): boolean {
      return this.selectable.length > 0;
    },
    events(): Array<{stage: EventStage, name: GlobalEventName}> {
      return eventsInPlay(this.turmoil);
    },
    /* The players who used the ruling policy's action this generation. */
    policyUsers(): Array<Color> {
      return this.turmoil.policyActionUsers
        .filter((u) => u.turmoilPolicyActionUsed || u.politicalAgendasActionUsedCount > 0)
        .map((u) => u.color);
    },
  },
  methods: {
    agendaOf(party: PartyName): Agenda | undefined {
      return partyAgenda(this.turmoil, party);
    },
    reserveOf(color: Color): number {
      return this.turmoil.reserve.find((r) => r.color === color)?.number ?? 0;
    },
    nameOf(color: Color): string {
      return this.players.find((p) => p.color === color)?.name ?? color;
    },
  },
});
</script>
