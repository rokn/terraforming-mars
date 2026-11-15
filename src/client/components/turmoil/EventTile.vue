<template>
  <component :is="selectable ? 'button' : 'div'" :type="selectable ? 'button' : undefined"
    class="tm-event"
    :class="[stage !== undefined ? 'tm-event--' + stage : '', {'tm-event--selectable': selectable, 'tm-event--selected': selected}]"
    :aria-pressed="selectable ? selected : undefined"
    data-test="event"
    @click="selectable && $emit('select', name)">
    <span v-if="stage !== undefined" class="tm-event-head">
      <span class="tm-event-stage" data-test="event-stage" v-i18n>{{ stageLabel }}</span>
      <span class="tm-event-when" v-i18n>{{ stageWhen }}</span>
    </span>
    <span class="tm-event-name" data-test="event-name" v-i18n>{{ name }}</span>
    <span class="tm-event-parties">
      <span class="tm-event-party" :title="$t('A neutral delegate joins this party when the event is revealed')">
        <span class="tm-event-party-key" v-i18n>Revealed</span>
        <PartyChip :party="event.revealedDelegate" />
      </span>
      <span class="tm-event-party" :title="$t('A neutral delegate joins this party when the event becomes current')">
        <span class="tm-event-party-key" v-i18n>Current</span>
        <PartyChip :party="event.currentDelegate" />
      </span>
    </span>
    <span class="card-container tm-event-effect">
      <span class="card-content tm-event-render">
        <CardRenderData :renderData="event.renderData" />
      </span>
    </span>
    <span class="tm-event-text" data-test="event-text" v-i18n>{{ event.description }}</span>
  </component>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import CardRenderData from '@/client/components/card/CardRenderData.vue';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import {ClientGlobalEvent} from '@/common/turmoil/ClientGlobalEvent';
import {getGlobalEvent} from '@/client/turmoil/ClientGlobalEventManifest';
import {EventStage} from '@/client/utils/turmoil';

const STAGES: Record<EventStage, {label: string, when: string}> = {
  distant: {label: 'Distant', when: 'Coming next generation'},
  coming: {label: 'Coming', when: 'Current next generation'},
  current: {label: 'Current', when: 'Resolves this generation'},
};

/**
 * A global event: its stage, name, the parties that gain a neutral delegate from it, and its effect
 * drawn as on the card and in words.
 *
 * When `selectable`, it is a button that emits `select` with the event's name.
 */
export default defineComponent({
  name: 'EventTile',
  props: {
    name: {
      type: String as () => GlobalEventName,
      required: true,
    },
    stage: {
      type: String as () => EventStage | undefined,
      default: undefined,
    },
    selectable: {
      type: Boolean,
      default: false,
    },
    selected: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select'],
  components: {
    CardRenderData,
    PartyChip,
  },
  computed: {
    event(): ClientGlobalEvent {
      const event = getGlobalEvent(this.name);
      if (event === undefined) {
        throw new Error(`Can't find global event ${this.name}`);
      }
      return event;
    },
    stageLabel(): string {
      return this.stage === undefined ? '' : STAGES[this.stage].label;
    },
    stageWhen(): string {
      return this.stage === undefined ? '' : STAGES[this.stage].when;
    },
  },
});
</script>
