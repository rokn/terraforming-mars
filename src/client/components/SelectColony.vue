<template>
  <div class="wf-component wf-component--select-colony" :class="{'wf-component--select-colony-compact': compact}">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <!-- The operations panel is too narrow for tiles: it lists their names, and the Colonies view shows the tiles. -->
    <template v-if="compact">
      <div class="tm-colony-picks" data-test="colony-picks">
        <label v-for="colony in colonies" :key="colony.name" class="form-radio tm-colony-pick">
          <input type="radio" v-model="selectedColony" :value="colony.name">
          <i class="form-icon"></i>
          <span v-i18n>{{ colony.name }}</span>
        </label>
      </div>
      <div class="tm-colony-picks-hint" v-i18n>Or click a highlighted tile in the Colonies view.</div>
    </template>
    <div v-else class="tm-colony-choices" data-test="colony-choices">
      <ColonyTile v-for="colony in colonies" :key="colony.name"
        :colony="colony"
        :players="playerView.players ?? []"
        selectable
        :selected="selectedColony === colony.name"
        :fadeMarker="isBuild"
        @select="selectedColony = $event" />
    </div>
    <div v-if="showsave === true" class="nofloat">
      <AppButton @click="saveData" :title="playerinput.buttonLabel" :disabled="!canSave()" data-primary />
    </div>
  </div>
</template>
<script lang="ts">
import {defineComponent} from 'vue';
import ColonyTile from '@/client/components/colonies/ColonyTile.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {SelectColonyModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectColonyResponse} from '@/common/inputs/InputResponse';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyModel} from '@/common/models/ColonyModel';
import {colonyPick} from '@/client/utils/centerView';

type DataModel = {
  selectedColony: ColonyName | undefined,
};

/**
 * Asks for one colony tile. Shows the tiles large and clickable, except where an ancestor provides
 * `compactColonies` returning true (the narrow operations panel): there it lists the names and shares
 * the choice through `colonyPick`, so the tiles can be clicked in the Colonies view instead.
 */
export default defineComponent({
  name: 'SelectColony',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectColonyModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectColonyResponse) => void,
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
    compactColonies: {
      default: () => () => false,
    },
  },
  data(): DataModel {
    const colonies = this.playerinput.coloniesModel ?? [];
    return {
      // A single tile to choose starts chosen, so Enter confirms it.
      selectedColony: colonies.length === 1 ? colonies[0].name : undefined,
    };
  },
  components: {
    ColonyTile,
    AppButton,
  },
  computed: {
    colonies(): ReadonlyArray<ColonyModel> {
      return this.playerinput.coloniesModel ?? [];
    },
    isBuild(): boolean {
      return this.playerinput.buttonLabel === 'Build';
    },
    compact(): boolean {
      return (this.compactColonies as () => boolean)();
    },
    pickedElsewhere(): ColonyName | undefined {
      return colonyPick.selected;
    },
  },
  watch: {
    compact: {
      handler(compact: boolean, wasCompact: boolean | undefined) {
        if (compact) {
          colonyPick.offered = this.colonies.map((c) => c.name);
          colonyPick.selected = this.selectedColony;
          colonyPick.build = this.isBuild;
        } else if (wasCompact === true) {
          this.release();
        }
      },
      immediate: true,
    },
    selectedColony(name: ColonyName | undefined) {
      if (this.compact) {
        colonyPick.selected = name;
      }
    },
    pickedElsewhere(name: ColonyName | undefined) {
      if (this.compact && name !== undefined && this.colonies.some((c) => c.name === name)) {
        this.selectedColony = name;
      }
    },
  },
  beforeUnmount() {
    if (this.compact) {
      this.release();
    }
  },
  methods: {
    release(): void {
      colonyPick.offered = [];
      colonyPick.selected = undefined;
      colonyPick.build = false;
    },
    canSave() {
      return this.selectedColony !== undefined;
    },
    saveData() {
      if (this.selectedColony !== undefined) {
        this.onsave({type: 'colony', colonyName: this.selectedColony});
      }
    },
  },
});
</script>
