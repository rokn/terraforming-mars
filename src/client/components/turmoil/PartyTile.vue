<template>
  <component :is="selectable ? 'button' : 'div'" :type="selectable ? 'button' : undefined"
    class="tm-party"
    :class="{'tm-party--ruling': ruling, 'tm-party--selectable': selectable, 'tm-party--selected': selected, 'tm-party--dimmed': dimmed}"
    :style="{'--tm-party': colors.fill, '--tm-party-ink': colors.ink}"
    :aria-pressed="selectable ? selected : undefined"
    :data-party="party.name"
    data-test="party"
    @click="selectable && $emit('select', party.name)">
    <span class="tm-party-band">
      <span class="tm-party-name" v-i18n>{{ party.name }}</span>
    </span>
    <span class="tm-party-flags">
      <span v-if="ruling" class="tm-party-flag tm-party-flag--ruling" data-test="ruling" v-i18n>Ruling</span>
      <span v-if="dominant" class="tm-party-flag tm-party-flag--dominant" data-test="dominant" v-i18n>Dominant</span>
    </span>
    <span class="tm-party-seats">
      <span class="tm-party-leader" :title="$t('Party leader')">
        <DelegateIcon v-if="party.partyLeader !== undefined" :color="party.partyLeader" :size="28" />
        <span v-else class="tm-party-leader-empty"></span>
        <span class="tm-party-seat-label" v-i18n>Leader</span>
        <span class="tm-party-count" :title="$t('Delegates')" data-test="delegate-count">{{ delegateCount }}</span>
      </span>
      <span class="tm-party-delegates" data-test="delegates">
        <DelegateIcon v-for="(color, idx) in members" :key="idx" :color="color" :size="18" />
        <span v-if="delegateCount === 0" class="tm-party-empty" v-i18n>No delegates</span>
      </span>
    </span>
    <span v-if="agenda !== undefined" class="tm-party-agenda">
      <span class="tm-party-agenda-row">
        <span class="tm-party-agenda-key" v-i18n>Bonus</span>
        <span class="tm-party-agenda-text" data-test="bonus" v-i18n>{{ bonusText }}</span>
      </span>
      <span class="tm-party-agenda-row" :class="{'tm-party-agenda-row--on': ruling}">
        <span class="tm-party-agenda-key" v-i18n>Policy</span>
        <span class="tm-party-agenda-text" data-test="policy" v-i18n>{{ policyText }}</span>
      </span>
    </span>
    <span v-if="selected" class="tm-party-check" aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="square"><path d="M4 12l5 5L20 6" /></svg>
    </span>
  </component>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PartyModel} from '@/common/models/TurmoilModel';
import {Agenda} from '@/common/turmoil/Types';
import {Color} from '@/common/Color';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';
import {PartyColors, agendaText, partyColors} from '@/client/utils/turmoil';

/**
 * A Turmoil party: its name on a band of its colour, ruling and dominant markers, the leader and the
 * other delegates, and the bonus and policy it brings when it rules.
 *
 * When `selectable`, it is a button that emits `select` with the party's name.
 */
export default defineComponent({
  name: 'PartyTile',
  props: {
    party: {
      type: Object as () => PartyModel,
      required: true,
    },
    agenda: {
      type: Object as () => Agenda | undefined,
      default: undefined,
    },
    ruling: {
      type: Boolean,
      default: false,
    },
    dominant: {
      type: Boolean,
      default: false,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
    dimmed: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select'],
  components: {
    DelegateIcon,
  },
  computed: {
    colors(): PartyColors {
      return partyColors(this.party.name);
    },
    /* One colour per delegate other than the leader, in seating order. */
    members(): Array<Color> {
      let leaderSkipped = false;
      return this.party.delegates.flatMap((d) => {
        let count = d.number;
        if (!leaderSkipped && d.color === this.party.partyLeader) {
          leaderSkipped = true;
          count--;
        }
        return Array<Color>(Math.max(0, count)).fill(d.color);
      });
    },
    delegateCount(): number {
      return this.party.delegates.reduce((sum, d) => sum + d.number, 0);
    },
    bonusText(): string {
      return this.agenda === undefined ? '' : agendaText(this.agenda.bonusId);
    },
    policyText(): string {
      return this.agenda === undefined ? '' : agendaText(this.agenda.policyId);
    },
  },
});
</script>
