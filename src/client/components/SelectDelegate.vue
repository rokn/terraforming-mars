<template>
  <div class="wf-component wf-component--select-delegate">
    <div v-if="showtitle === true">{{ $t(playerinput.title) }}</div>
    <div class="tm-delegate-picks">
      <label v-for="player in (playerinput.players || [])" :key="player" class="form-radio form-inline tm-delegate-pick" data-test="delegate-pick">
        <input type="radio" v-model="selectedPlayer" :value="player">
        <i class="form-icon"></i>
        <DelegateIcon :color="player === 'NEUTRAL' ? 'neutral' : player" :size="18" />
        <span v-if="player === 'NEUTRAL'" v-i18n>Neutral</span>
        <SelectPlayerRow v-else :player="playerView.players.find((otherPlayer) => otherPlayer.color === player)" />
      </label>
    </div>
    <AppButton v-if="showsave === true" size="big" @click="saveData" :title="$t(playerinput.buttonLabel)" :disabled="selectedPlayer === undefined" data-primary />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {ColorWithNeutral} from '@/common/Color';
import {SelectDelegateModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import SelectPlayerRow from '@/client/components/SelectPlayerRow.vue';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';
import {SelectDelegateResponse} from '@/common/inputs/InputResponse';

interface DataModel {
  selectedPlayer: ColorWithNeutral | undefined;
}

export default defineComponent({
  name: 'SelectDelegate',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectDelegateModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectDelegateResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): DataModel {
    const players = this.playerinput.players ?? [];
    return {
      // A single delegate to choose starts chosen, so Enter confirms it.
      selectedPlayer: players.length === 1 ? players[0] : undefined,
    };
  },
  components: {
    AppButton,
    SelectPlayerRow,
    DelegateIcon,
  },
  methods: {
    saveData() {
      if (this.selectedPlayer !== undefined) {
        this.onsave({type: 'delegate', player: this.selectedPlayer});
      }
    },
  },
});
</script>
