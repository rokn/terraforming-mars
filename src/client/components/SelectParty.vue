<template>
  <div class="wf-component wf-component--select-party" :class="{'wf-component--select-party-compact': compact}">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- The operations panel is too narrow for party boards: it lists their names, and the Turmoil view shows the parties. -->
    <template v-if="compact">
      <div class="tm-party-picks" data-test="party-picks">
        <label v-for="party in offered" :key="party" class="form-radio tm-party-pick">
          <input type="radio" v-model="selectedParty" :value="party">
          <i class="form-icon"></i>
          <PartyChip :party="party" />
        </label>
      </div>
      <div class="tm-colony-picks-hint" v-i18n>Or click a highlighted party in the Turmoil view.</div>
    </template>
    <div v-else-if="turmoil !== undefined" class="tm-party-choices" data-test="party-choices">
      <PartyTile v-for="party in turmoil.parties" :key="party.name"
        :party="party"
        :agenda="agendaOf(party.name)"
        :ruling="party.name === turmoil.ruling"
        :dominant="party.name === turmoil.dominant"
        :selectable="offered.includes(party.name)"
        :selected="selectedParty === party.name"
        :dimmed="!offered.includes(party.name)"
        @select="selectedParty = $event" />
    </div>
    <div v-if="showsave === true" class="nofloat">
      <AppButton :disabled="selectedParty === undefined" @click="saveData" :title="playerinput.buttonLabel" data-primary />
    </div>
  </div>
</template>
<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import PartyTile from '@/client/components/turmoil/PartyTile.vue';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import {SelectPartyModel} from '@/common/models/PlayerInputModel';
import {PartyName} from '@/common/turmoil/PartyName';
import {SelectPartyResponse} from '@/common/inputs/InputResponse';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {Agenda} from '@/common/turmoil/Types';
import {partyAgenda} from '@/client/utils/turmoil';
import {partyPick} from '@/client/utils/centerView';

/**
 * Asks for one party. Shows the six parties large, the offered ones clickable, except where an ancestor
 * provides `compactTiles` returning true (the narrow operations panel): there it lists the offered names
 * and shares the choice through `partyPick`, so the parties can be clicked in the Turmoil view instead.
 */
export default defineComponent({
  name: 'SelectParty',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectPartyModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectPartyResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  inject: {
    compactTiles: {
      default: () => () => false,
    },
  },
  data() {
    const parties = this.playerinput.parties ?? [];
    return {
      // A single party to choose starts chosen, so Enter confirms it.
      selectedParty: (parties.length === 1 ? parties[0] : undefined) as PartyName | undefined,
    };
  },
  components: {
    AppButton,
    PartyTile,
    PartyChip,
  },
  methods: {
    saveData() {
      if (this.selectedParty === undefined) {
        return;
      }
      this.onsave({type: 'party', partyName: this.selectedParty});
    },
    agendaOf(party: PartyName): Agenda | undefined {
      return this.turmoil === undefined ? undefined : partyAgenda(this.turmoil, party);
    },
    release(): void {
      partyPick.offered = [];
      partyPick.selected = undefined;
    },
  },
  computed: {
    turmoil(): TurmoilModel | undefined {
      return this.playerView.game?.turmoil;
    },
    offered(): ReadonlyArray<PartyName> {
      return this.playerinput.parties ?? [];
    },
    compact(): boolean {
      return (this.compactTiles as () => boolean)();
    },
    pickedElsewhere(): PartyName | undefined {
      return partyPick.selected;
    },
  },
  watch: {
    compact: {
      handler(compact: boolean, wasCompact: boolean | undefined) {
        if (compact) {
          partyPick.offered = [...this.offered];
          partyPick.selected = this.selectedParty;
        } else if (wasCompact === true) {
          this.release();
        }
      },
      immediate: true,
    },
    selectedParty(name: PartyName | undefined) {
      if (this.compact) {
        partyPick.selected = name;
      }
    },
    pickedElsewhere(name: PartyName | undefined) {
      if (this.compact && name !== undefined && this.offered.includes(name)) {
        this.selectedParty = name;
      }
    },
  },
  beforeUnmount() {
    if (this.compact) {
      this.release();
    }
  },
});
</script>
