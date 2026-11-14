<template>
  <div class="players-overview" v-if="hasPlayers">
    <OverviewSettings />
    <div class="other_player" v-if="thisPlayer === undefined || players.length > 1">
      <div v-for="(otherPlayer, index) in playersInOrder" :key="otherPlayer.color">
        <OtherPlayer v-if="thisPlayer === undefined || otherPlayer.color !== thisPlayer.color" :player="otherPlayer" :playerIndex="index" />
      </div>
    </div>
    <PlayerInfo v-for="(p, index) in playersInOrder"
      :player="p"
      :key="p.color"
      :playerView="playerView"
      :firstForGen="getIsFirstForGen(p)"
      :actionLabel="getActionLabel(p)"
      :playerIndex="index" />
    <div v-if="playerView.players.length > 1 && thisPlayer !== undefined" class="player-divider"></div>
    <PlayerInfo
      v-if="thisPlayer !== undefined"
      :player="thisPlayer"
      :key="thisPlayer.color"
      :playerView="playerView"
      :firstForGen="getIsFirstForGen(thisPlayer)"
      :actionLabel="getActionLabel(thisPlayer)"
      :playerIndex="-1" />
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import OverviewSettings from '@/client/components/overview/OverviewSettings.vue';
import OtherPlayer from '@/client/components/OtherPlayer.vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel, getActionLabel, playerIndex} from '@/client/components/overview/ActionLabel';

export default defineComponent({
  name: 'PlayersOverview',
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
  },
  computed: {
    players(): Array<PublicPlayerModel> {
      return this.playerView.players;
    },
    thisPlayer(): PublicPlayerModel | undefined {
      return this.playerView.thisPlayer;
    },
    hasPlayers(): boolean {
      return this.players.length > 0;
    },
    playersInOrder(): Array<PublicPlayerModel> {
      const players = this.players;
      if (this.thisPlayer === undefined) {
        return players;
      }

      let result = [];
      let currentPlayerOffset = 0;
      const currentPlayerIndex = playerIndex(
        this.thisPlayer.color,
        this.players,
      );

      // shift the array by putting the player on focus at the tail
      currentPlayerOffset = currentPlayerIndex + 1;
      result = players
        .slice(currentPlayerOffset)
        .concat(players.slice(0, currentPlayerOffset));
      // return all but the focused user
      return result.slice(0, -1);
    },
  },
  components: {
    PlayerInfo,
    OverviewSettings,
    OtherPlayer,
  },
  methods: {
    getIsFirstForGen(player: PublicPlayerModel): boolean {
      return playerIndex(player.color, this.players) === 0;
    },
    getActionLabel(player: PublicPlayerModel): ActionLabel {
      return getActionLabel(this.playerView, player);
    },
  },
});
</script>
