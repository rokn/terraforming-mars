<template>
  <div class="tm-panel tm-ma">
    <div class="tm-panel-inner">
      <h3 class="tm-section-title tm-section-title--small">
        <span v-i18n>Milestones</span>
        <span class="tm-section-caption" data-test="milestones-caption">{{ claimedCount }}/{{ maxMilestones }} <span v-i18n>claimed</span></span>
      </h3>
      <div v-for="milestone in milestones" :key="milestone.name"
        class="tm-ma-row"
        :class="{'tm-ma-row--hot': canClaim(milestone)}"
        :title="$t(milestoneDescription(milestone))"
        data-test="milestone">
        <span class="tm-ma-name" v-i18n>{{ milestone.name }}</span>
        <span v-if="milestone.color !== undefined" class="tm-ma-owner">
          <PlayerCube :color="milestone.color" :size="12" />{{ milestone.playerName }}
        </span>
        <span v-else-if="canClaim(milestone)" class="tm-ma-note tm-ma-note--hot">
          <span v-i18n>You qualify</span> · {{ milestoneCost }} M€
        </span>
        <span v-else-if="claimedCount < maxMilestones" class="tm-ma-note">
          <span v-i18n>You</span> {{ myScore(milestone.scores) }}
        </span>
        <span v-else class="tm-ma-note" v-i18n>Closed</span>
      </div>

      <div class="tm-ma-divider"></div>

      <h3 class="tm-section-title tm-section-title--small">
        <span v-i18n>Awards</span>
        <span class="tm-section-caption" data-test="awards-caption">
          <template v-if="nextAwardCost !== undefined"><span v-i18n>Fund next</span> · {{ nextAwardCost }} M€</template>
          <template v-else><span v-i18n>All funded</span></template>
        </span>
      </h3>
      <div v-for="award in awards" :key="award.name" class="tm-ma-row" :title="$t(awardDescription(award))" data-test="award">
        <span class="tm-ma-name" v-i18n>{{ award.name }}</span>
        <span class="tm-ma-note" :class="{'tm-ma-note--good': award.color !== undefined && leaderIsMe(award.scores)}">
          <template v-if="award.color !== undefined"><span v-i18n>Funded</span> · </template>
          <template v-if="leaders(award.scores).length === 0">—</template>
          <template v-else-if="leaders(award.scores).length > 1"><span v-i18n>Tied</span> · {{ topScore(award.scores) }}</template>
          <template v-else>{{ leaderNames(award.scores) }} <span v-i18n>leads</span> · {{ topScore(award.scores) }}</template>
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ClaimedMilestoneModel} from '@/common/models/ClaimedMilestoneModel';
import {FundedAwardModel} from '@/common/models/FundedAwardModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {AWARD_COSTS, MAX_MILESTONES, MILESTONE_COST} from '@/common/constants';
import {getAward, getMilestone} from '@/client/MilestoneAwardManifest';
import PlayerCube from '@/client/components/common/PlayerCube.vue';

type Score = {color: Color, score: number};

export default defineComponent({
  name: 'MilestonesAwardsPanel',
  props: {
    milestones: {
      type: Array as PropType<ReadonlyArray<ClaimedMilestoneModel>>,
      required: true,
    },
    awards: {
      type: Array as PropType<ReadonlyArray<FundedAwardModel>>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    /* The viewing player's color, or undefined for spectators. */
    myColor: {
      type: String as () => Color | undefined,
      default: undefined,
    },
  },
  components: {
    PlayerCube,
  },
  computed: {
    maxMilestones(): number {
      return MAX_MILESTONES;
    },
    milestoneCost(): number {
      return MILESTONE_COST;
    },
    claimedCount(): number {
      return this.milestones.filter((m) => m.color !== undefined).length;
    },
    nextAwardCost(): number | undefined {
      const funded = this.awards.filter((a) => a.color !== undefined).length;
      return AWARD_COSTS[funded];
    },
  },
  methods: {
    canClaim(milestone: ClaimedMilestoneModel): boolean {
      if (milestone.color !== undefined || this.claimedCount >= MAX_MILESTONES) {
        return false;
      }
      return milestone.scores.some((s) => s.color === this.myColor && s.claimable);
    },
    myScore(scores: ReadonlyArray<Score>): number | string {
      return scores.find((s) => s.color === this.myColor)?.score ?? '—';
    },
    topScore(scores: ReadonlyArray<Score>): number {
      return Math.max(0, ...scores.map((s) => s.score));
    },
    leaders(scores: ReadonlyArray<Score>): ReadonlyArray<Score> {
      const top = this.topScore(scores);
      return top === 0 ? [] : scores.filter((s) => s.score === top);
    },
    leaderIsMe(scores: ReadonlyArray<Score>): boolean {
      return this.leaders(scores).some((s) => s.color === this.myColor);
    },
    leaderNames(scores: ReadonlyArray<Score>): string {
      return this.leaders(scores)
        .map((s) => s.color === this.myColor ? this.$t('You') : (this.players.find((p) => p.color === s.color)?.name ?? s.color))
        .join(', ');
    },
    milestoneDescription(milestone: ClaimedMilestoneModel): string {
      return getMilestone(milestone.name)?.description ?? '';
    },
    awardDescription(award: FundedAwardModel): string {
      return getAward(award.name)?.description ?? '';
    },
  },
});
</script>
