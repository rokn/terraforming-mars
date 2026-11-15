<template>
  <button type="button" class="tm-panel tm-politics-card" :title="$t('Show Turmoil')" data-test="politics-card" @click="$emit('open')">
    <span class="tm-panel-inner">
      <span class="tm-section-title tm-section-title--small">
        <span v-i18n>Politics</span>
        <kbd class="tm-kbd" :title="$t('Shortcut')">T</kbd>
      </span>
      <span v-if="turmoil.ruling !== undefined" class="tm-politics-line" data-test="politics-ruling">
        <PartyChip :party="turmoil.ruling" />
        <span class="tm-politics-policy" :title="$t(policyText)" v-i18n>{{ policyText }}</span>
      </span>
      <span class="tm-politics-line">
        <span class="tm-politics-key" v-i18n>Dominant</span>
        <PartyChip v-if="turmoil.dominant !== undefined" :party="turmoil.dominant" data-test="politics-dominant" />
        <span class="tm-politics-key tm-politics-key--push" v-i18n>Chair</span>
        <template v-if="turmoil.chairman !== undefined">
          <DelegateIcon :color="turmoil.chairman" :size="14" />
          <span v-if="turmoil.chairman === 'neutral'" class="tm-politics-value" data-test="politics-chairman" v-i18n>Neutral</span>
          <span v-else class="tm-politics-value" data-test="politics-chairman">{{ chairmanName }}</span>
        </template>
      </span>
      <span v-if="event !== undefined" class="tm-politics-line" data-test="politics-event">
        <span class="tm-politics-key" v-i18n>{{ event.stage === 'current' ? 'Event' : 'Coming' }}</span>
        <span class="tm-politics-value tm-politics-event" v-i18n>{{ event.name }}</span>
      </span>
    </span>
  </button>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {GlobalEventName} from '@/common/turmoil/globalEvents/GlobalEventName';
import PartyChip from '@/client/components/turmoil/PartyChip.vue';
import DelegateIcon from '@/client/components/turmoil/DelegateIcon.vue';
import {EventStage, rulingPolicyText} from '@/client/utils/turmoil';

/**
 * The Turmoil summary in the left column: the ruling party and its policy, the dominant party (which
 * rules next), the chairman and the global event to resolve this generation. Emits `open` when clicked.
 */
export default defineComponent({
  name: 'PoliticsCard',
  props: {
    turmoil: {
      type: Object as () => TurmoilModel,
      required: true,
    },
    players: {
      type: Array as () => ReadonlyArray<PublicPlayerModel>,
      required: true,
    },
  },
  emits: ['open'],
  components: {
    PartyChip,
    DelegateIcon,
  },
  computed: {
    policyText(): string {
      return rulingPolicyText(this.turmoil) ?? '';
    },
    chairmanName(): string {
      return this.players.find((p) => p.color === this.turmoil.chairman)?.name ?? '';
    },
    /* The event that resolves at the end of this generation, or failing that, the coming one. */
    event(): {stage: EventStage, name: GlobalEventName} | undefined {
      if (this.turmoil.current !== undefined) {
        return {stage: 'current', name: this.turmoil.current};
      }
      return this.turmoil.coming === undefined ? undefined : {stage: 'coming', name: this.turmoil.coming};
    },
  },
});
</script>
