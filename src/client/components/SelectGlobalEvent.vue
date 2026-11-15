<template>
  <div class="wf-component wf-component--select-global-event">
    <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
    <div class="tm-event-choices">
      <EventTile v-for="globalEventName in playerinput.globalEventNames" :key="globalEventName"
        :name="globalEventName"
        selectable
        :selected="selected === globalEventName"
        @select="selected = $event" />
    </div>
    <div v-if="showsave === true" class="nofloat">
      <AppButton :disabled="selected === undefined" type="submit" @click="saveData" title="OK" data-primary />
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import EventTile from '@/client/components/turmoil/EventTile.vue';
import {SelectGlobalEventModel} from '@/common/models/PlayerInputModel';
import {SelectGlobalEventResponse} from '@/common/inputs/InputResponse';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';

type DataModel = {
  selected: GlobalEventName | undefined;
};

export default defineComponent({
  name: 'SelectGlobalEvent',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectGlobalEventModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectGlobalEventResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: false,
      default: false,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): DataModel {
    return {
      selected: undefined,
    };
  },
  components: {
    EventTile,
    AppButton,
  },
  methods: {
    saveData() {
      if (this.selected === undefined) {
        throw new Error('Select a global event');
      }
      this.onsave({type: 'globalEvent', globalEventName: this.selected});
    },
  },
});

</script>
