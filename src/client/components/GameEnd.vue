<template>
  <div id="game-end" class="game_end_cont tm-end" :class="{'tm-end--app': !isSoloGame}">
    <header class="tm-header">
      <div class="tm-header-brand">
        <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
          <polygon points="18,2 32,10 32,26 18,34 4,26 4,10" class="tm-header-logo-hex" />
          <polygon points="18,8 27,13 27,23 18,28 9,23 9,13" class="tm-header-logo-ring" />
          <circle cx="18" cy="18" r="3.4" class="tm-header-logo-dot" />
        </svg>
        <div class="tm-header-title">
          <h1 class="tm-header-name"><HomeLink>{{ constants.APP_NAME }}</HomeLink></h1>
          <span class="tm-header-meta"><span v-i18n>Game finished!</span> · <span v-i18n>Generation</span> {{ game.generation }}</span>
        </div>
      </div>
      <span class="tm-header-over" v-i18n>Game over</span>
      <div v-if="!isSoloGame" class="tm-end-actions">
        <a href="new-game" class="tm-button tm-button--primary" v-i18n>Create New Game</a>
        <a href="." class="tm-button tm-button--secondary" v-i18n>Go to main page</a>
      </div>
    </header>

    <div v-if="!isSoloGame" class="tm-end-main">
      <section class="tm-panel tm-panel--large tm-end-results">
        <div class="tm-panel-inner">
          <FinalStandings :game="game" :players="playersInPlace" :winners="winners" />
          <h2 class="tm-section-title tm-end-sources-title" v-i18n>Points by source</h2>
          <div class="tm-end-sources">
            <div v-for="p in playersInPlace" :key="p.color" class="tm-end-source" data-test="end-source">
              <div class="tm-end-source-head"><PlayerCube :color="p.color" :size="16" /><span>{{ p.name }}</span></div>
              <div v-for="v in p.victoryPointsBreakdown.detailsCards" :key="v.cardName" class="tm-end-source-row">
                <span class="tm-end-source-vp">{{ v.victoryPoint }}</span><span v-i18n>{{ v.cardName }}</span>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsMilestones" :key="v.message + v.messageArgs" class="tm-end-source-row">
                <span class="tm-end-source-vp">{{ v.victoryPoint }}</span><span>{{ translateMilestoneDetails(v) }}</span>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsAwards" :key="v.message + v.messageArgs" class="tm-end-source-row">
                <span class="tm-end-source-vp">{{ v.victoryPoint }}</span><span>{{ translateAwardDetails(v) }}</span>
              </div>
              <div v-for="v in p.victoryPointsBreakdown.detailsPlanetaryTracks" :key="v.tag" class="tm-end-source-row">
                <span class="tm-end-source-vp">{{ v.points }}</span><span v-i18n>Most tags on the {{ v.tag }} track</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="tm-panel tm-panel--large tm-end-details">
        <div class="tm-panel-inner">
          <div class="tm-sheet-tabs tm-end-tabs" role="tablist">
            <button v-for="t in tabs" :key="t.key" type="button" role="tab" class="tm-sheet-tab"
              :class="{'tm-sheet-tab--on': tab === t.key}" :aria-selected="tab === t.key" :data-test="'end-tab-' + t.key" @click="tab = t.key" v-i18n>{{ t.label }}</button>
          </div>

          <div v-show="tab === 'board'" class="tm-end-tab tm-end-tab--board">
            <FitToBox class="tm-board-fit" zoomable>
              <div class="player_home_block tm-board-block">
                <Board
                  :spaces="game.spaces"
                  :expansions="game.gameOptions.expansions"
                  :venusScaleLevel="game.venusScaleLevel"
                  :altVenusBoard="game.gameOptions.altVenusBoard"
                  :boardName="game.gameOptions.boardName"
                  :oceans_count="game.oceans"
                  :oxygen_level="game.oxygenLevel"
                  :temperature="game.temperature"
                  :tileView="tileView"
                  @toggleTileView="cycleTileView()" />
                <MoonBoard v-if="game.moon !== undefined" :model="game.moon" :tileView="tileView" />
                <PlanetaryTracks v-if="game.gameOptions.expansions.pathfinders" :tracks="game.pathfinders" :gameOptions="game.gameOptions" />
                <DeltaProjectBoard v-if="game.gameOptions.expansions.deltaProject" :players="participant.players" />
              </div>
            </FitToBox>
          </div>

          <div v-if="tab === 'points'" class="tm-end-tab tm-end-tab--chart">
            <VictoryPointChart :datasets="vpDataset" :generation="game.generation" :animation="true" :id="'victory-point-chart'" />
          </div>

          <div v-if="tab === 'globals'" class="tm-end-tab tm-end-tab--globals">
            <table class="tm-end-table">
              <thead>
                <tr>
                  <th v-i18n>Player</th>
                  <th v-i18n>Temperature</th>
                  <th v-i18n>Oxygen</th>
                  <th v-i18n>Oceans</th>
                  <th v-if="game.gameOptions.expansions.venus" v-i18n>Venus</th>
                  <th v-if="game.gameOptions.expansions.moon" v-i18n>L. Habitat</th>
                  <th v-if="game.gameOptions.expansions.moon" v-i18n>L. Mining</th>
                  <th v-if="game.gameOptions.expansions.moon" v-i18n>L. Logistic</th>
                  <th v-i18n>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="data in playerContributionsData" :key="data.color">
                  <td><PlayerCube :color="data.color" :size="14" /> {{ data.player }}</td>
                  <td>{{ data.temp }}</td>
                  <td>{{ data.oxygen }}</td>
                  <td>{{ data.oceans }}</td>
                  <td v-if="game.gameOptions.expansions.venus">{{ data.venus }}</td>
                  <td v-if="game.gameOptions.expansions.moon">{{ data.moonHabitat }}</td>
                  <td v-if="game.gameOptions.expansions.moon">{{ data.moonMining }}</td>
                  <td v-if="game.gameOptions.expansions.moon">{{ data.moonLogistic }}</td>
                  <td class="tm-end-table-total">{{ data.total }}</td>
                </tr>
              </tbody>
            </table>
            <div class="tm-end-tab--chart">
              <VictoryPointChart :datasets="globalsDataset" :generation="game.generation" :animation="true" :id="'global-parameter-chart'" :yAxisLabel="'% completed'" />
            </div>
          </div>

          <div v-show="tab === 'log'" class="tm-end-tab tm-end-tab--scroll">
            <LogPanel :viewModel="participant" />
            <a :href="downloadLogUrl" target="_blank" v-i18n>Download game log</a>
          </div>
        </div>
      </section>
    </div>

    <div v-if="isSoloGame" class="game_end">
      <div v-if="isSoloGame">
        <div v-if="game.isSoloModeWin">
          <div class="game_end_success">
            <h2 v-i18n>You win!</h2>
            <div class="game_end_solo_img">
              <img src="assets/solo_win.png">
            </div>
            <div class="game_end_notice">
              <span v-i18n>But it isn't the reason to stop making Mars better.</span>
            </div>
            <ul class="game_end_list">
              <li v-i18n>Try to win with expansions enabled</li>
              <li v-i18n>Try to win before the last generation</li>
              <li><span v-i18n>Can you get</span> {{ participant.players[0].victoryPointsBreakdown.total + 10 }}<span v-i18n>+ Victory Points?</span></li>
            </ul>
          </div>
        </div>
        <div v-else>
          <div class="game_end_fail">
            <h2 v-i18n>Sorry, you lose.</h2>
            <div class="game_end_notice">
              <span v-i18n>Next time you will get more luck!</span><br>
              <span v-i18n>Also, take into account these small hints to win:</span>
            </div>
            <ul class="game_end_list" v-i18n>
              <li>Concentrate more on Global parameters, not on Victory Points</li>
              <li>Don't be greedy with card selection</li>
              <li>Try to increase heat production, not Megacredits</li>
              <li>Try starting with the Beginner corporation</li>
            </ul>
          </div>
        </div>
      </div>
      <div v-if="isSoloGame" class="game_end_navigation">
        <div>
          <a href="new-game">
            <AppButton size="big" type="back" />
            <span v-i18n>Create New Game</span>
          </a>

          <a href=".">
            <AppButton size="big" type="back" />
            <span v-i18n>Go to main page</span>
          </a>
        </div>
      </div>
      <div v-if="isSoloGame && game.isSoloModeWin" class="game-end-winner-announcement">
        <span v-for="p in winners" :key="p.color"><span :class="'log-player ' + getEndGamePlayerRowColorClass(p.color)">{{ p.name }}</span></span> <span v-i18n>won!</span>
      </div>
      <div class="game_end_victory_points">
        <h2><span v-i18n>Victory point breakdown after</span> {{ game.generation }} <span v-i18n>generations</span></h2>
        <table class="table game_end_table">
          <thead>
            <tr v-i18n>
              <th><div class="card-delegate"></div></th>
              <th><div class="tr"></div></th>
              <th><div class="m-and-a tooltip tooltip-top" :data-tooltip="$t('Milestones points')">M</div></th>
              <th><div class="m-and-a tooltip tooltip-top" :data-tooltip="$t('Awards points')">A</div></th>
              <th><div class="table-forest-tile"></div></th>
              <th><div class="table-city-tile"></div></th>
              <th v-if="game.moon !== undefined"><div class="table-moon-road-tile"></div></th>
              <th v-if="game.moon !== undefined"><div class="table-moon-habitat-tile"></div></th>
              <th v-if="game.moon !== undefined"><div class="table-moon-mine-tile"></div></th>
              <th v-if="game.pathfinders !== undefined"><div class="table-planetary-track"></div></th>
              <th><div class="vp">VP</div></th>
              <th v-if="game.gameOptions.escapeVelocity" class="clock-icon tooltip tooltip-top" :data-tooltip="$t('Escape Velocity penalty')">&#x23F3;</th>
              <th class="game-end-total"><div class="game-end-total-column">Total</div></th>
              <th><div class="mc-icon"></div></th>
              <th v-if="game.gameOptions.showTimers" class="clock-icon">&#x1F551;</th>
              <th><div class="table-red-arrow tooltip tooltip-top" :data-tooltip="$t('Actions taken this game')"></div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in playersInPlace" :key="p.color" :class="getEndGamePlayerRowColorClass(p.color)">
              <td>
                <a :href="'player?id='+p.id+'&noredirect'">{{ p.name }}</a>
                <div class="column-corporation">
                  <div v-for="(corporationName, index) in getCorporationName(p)" :key="index" v-i18n>{{ corporationName }}</div>
                </div>
              </td>
              <td>{{ p.victoryPointsBreakdown.terraformRating }}</td>
              <td>{{ p.victoryPointsBreakdown.milestones }}</td>
              <td>{{ p.victoryPointsBreakdown.awards }}</td>
              <td>{{ p.victoryPointsBreakdown.greenery }}</td>
              <td>{{ p.victoryPointsBreakdown.city }}</td>
              <td v-if="game.moon !== undefined">{{ p.victoryPointsBreakdown.moonRoads }}</td>
              <td v-if="game.moon !== undefined">{{ p.victoryPointsBreakdown.moonHabitats }}</td>
              <td v-if="game.moon !== undefined">{{ p.victoryPointsBreakdown.moonMines }}</td>
              <td v-if="game.pathfinders !== undefined"> {{ p.victoryPointsBreakdown.planetaryTracks }}</td>
              <td>{{ p.victoryPointsBreakdown.victoryPoints }}</td>
              <td v-if="game.gameOptions.escapeVelocity">{{ p.victoryPointsBreakdown.escapeVelocity }}</td>
              <td class="game-end-total">{{ p.victoryPointsBreakdown.total }}</td>
              <td class="game-end-mc">
                <div>{{ p.megacredits }}</div>
              </td>
              <td v-if="game.gameOptions.showTimers"><div class="game-end-timer">{{ getTimer(p) }}</div></td>
              <td><div class="game-end-timer">{{ p.actionsTakenThisGame }}</div></td>
            </tr>
          </tbody>
        </table>
        <br>
        <h2 v-i18n>Victory points details</h2>
        <VictoryPointChart
          :datasets="vpDataset"
          :generation="game.generation"
          :animation="true"
          :id="'victory-point-chart'"
        />
        <div class="game-end-flexrow">
          <div v-for="p in playersInPlace" :key="p.color" class="game-end-column">
            <div class="game-end-winner-scorebreak-player-title">
              <div :class="'game-end-player ' + getEndGamePlayerRowColorClass(p.color)"><a :href="'player?id='+p.id+'&noredirect'">{{ p.name }}</a></div>
            </div>
            <div v-for="v in p.victoryPointsBreakdown.detailsCards" :key="v.cardName">
              <div class="game-end-column-row">
                <div class="game-end-column-vp">{{ v.victoryPoint }}</div>
                <div class="game-end-column-text" v-i18n>{{ v.cardName }}</div>
              </div>
            </div>
            <div class="game-end-column-row">
              <div class="game-end-column-vp">&nbsp;</div>
              <div class="game-end-column-text">&nbsp;</div>
            </div>
            <div v-for="v in p.victoryPointsBreakdown.detailsMilestones" :key="v.message">
              <div class="game-end-column-row">
                <div class="game-end-column-vp">{{ v.victoryPoint }}</div>
                <div class="game-end-column-text">{{ translateMilestoneDetails(v) }}</div>
              </div>
            </div>
            <div v-for="v in p.victoryPointsBreakdown.detailsAwards" :key="v.message">
              <div class="game-end-column-row">
                <div class="game-end-column-vp">{{ v.victoryPoint }}</div>
                <div class="game-end-column-text">{{ translateAwardDetails(v) }}</div>
              </div>
            </div>
            <div v-for="v in p.victoryPointsBreakdown.detailsPlanetaryTracks" :key="v.tag">
              <div class="game-end-column-row">
                <div class="game-end-column-vp">{{ v.points }}</div>
                <div class="game-end-column-text" v-i18n>Most tags on the {{ v.tag }} track</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="game_end_victory_points">
        <h2 v-i18n>Global Parameter Contributions</h2>
        <table class="table game_end_table">
          <thead>
            <tr>
              <th><div class="card-delegate"></div></th>
              <th><div class="tile temperature-tile"></div></th>
              <th><div class="tile oxygen-tile"></div></th>
              <th><div class="tile ocean-tile"></div></th>
              <th v-if="game.gameOptions.expansions.venus"><div class="tile venus-tile"></div></th>
              <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-habitat-tile"></div></th>
              <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-mine-tile"></div></th>
              <th v-if="game.gameOptions.expansions.moon"><div class="table-moon-road-tile"></div></th>
              <th><div class="game-end-total-column">Total</div></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="data in playerContributionsData" :key="data.color" :class="getEndGamePlayerRowColorClass(data.color)">
              <td>{{ data.player }}</td>
              <td>{{ data.temp }}</td>
              <td>{{ data.oxygen }}</td>
              <td>{{ data.oceans }}</td>
              <td v-if="game.gameOptions.expansions.venus">{{ data.venus }}</td>
              <td v-if="game.gameOptions.expansions.moon">{{ data.moonHabitat }}</td>
              <td v-if="game.gameOptions.expansions.moon">{{ data.moonMining }}</td>
              <td v-if="game.gameOptions.expansions.moon">{{ data.moonLogistic }}</td>
              <td class="game-end-total">{{ data.total }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="game-end-flexrow">
        <div class="game_end_block--board game-end-column">
          <VictoryPointChart
            :datasets="globalsDataset"
            :generation="game.generation"
            :animation="true"
            :id="'global-parameter-chart'"
            :yAxisLabel="'% completed'"
          />
          <h2 v-i18n>Final situation on the board</h2>
          <Board
            :spaces="game.spaces"
            :expansions="game.gameOptions.expansions"
            :venusScaleLevel="game.venusScaleLevel"
            :altVenusBoard="game.gameOptions.altVenusBoard"
            :boardName="game.gameOptions.boardName"
            :oceans_count="game.oceans"
            :oxygen_level="game.oxygenLevel"
            :temperature="game.temperature"
            :tileView="tileView"
            @toggleTileView="cycleTileView()" />
          <MoonBoard v-if="game.moon !== undefined" :model="game.moon" :tileView="tileView" />
          <div v-if="game.gameOptions.expansions.pathfinders">
            <PlanetaryTracks :tracks="game.pathfinders" :gameOptions="game.gameOptions" />
          </div>
          <DeltaProjectBoard v-if="game.gameOptions.expansions.deltaProject" :players="participant.players" />
        </div>
        <div class="game_end_block--log game-end-column">
          <LogPanel :viewModel="participant" />
          <a :href="downloadLogUrl" target="_blank" v-i18n>Download game log</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import FinalStandings from '@/client/components/gameend/FinalStandings.vue';
import FitToBox from '@/client/components/common/FitToBox.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {defineComponent} from 'vue';
import * as constants from '@/common/constants';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {setFaviconStatus} from '@/client/utils/favicon';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {paths} from '@/common/app/paths';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel, ViewModel} from '@/common/models/PlayerModel';
import Board from '@/client/components/Board.vue';
import MoonBoard from '@/client/components/moon/MoonBoard.vue';
import {nextTileView, TileView} from '@/client/components/board/TileView';
import PlanetaryTracks from '@/client/components/pathfinders/PlanetaryTracks.vue';
import DeltaProjectBoard from '@/client/components/delta/DeltaProjectBoard.vue';
import LogPanel from '@/client/components/logpanel/LogPanel.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import HomeLink from '@/client/components/common/HomeLink.vue';
import VictoryPointChart, {DataSet} from '@/client/components/gameend/VictoryPointChart.vue';
import {playerColorClass} from '@/common/utils/utils';
import {Timer} from '@/common/Timer';
import {Color} from '@/common/Color';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {GlobalParameter} from '@/common/GlobalParameter';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {$t, translateTextWithParams, translateMessage} from '@/client/directives/i18n';
import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {MADetail} from '@/common/game/VictoryPointsBreakdown';
import {AwardName} from '@/common/ma/AwardName';

/** The tabs of the details panel. */
type EndTab = 'board' | 'points' | 'globals' | 'log';
const TABS: ReadonlyArray<{key: EndTab, label: string}> = [
  {key: 'board', label: 'Final board'},
  {key: 'points', label: 'Points over time'},
  {key: 'globals', label: 'Global parameters'},
  {key: 'log', label: 'Game log'},
];

export default defineComponent({
  name: 'GameEnd',
  props: {
    participant: {
      type: Object as () => ViewModel,
      required: true,
    },
  },
  computed: {
    game(): GameModel {
      return this.participant.game;
    },
    downloadLogUrl() {
      return `${paths.END_GAME_LOG}?id=${this.participant.id}`;
    },
    playersInPlace(): Array<PublicPlayerModel> {
      const sorted = this.participant.players.toSorted(function(a:PublicPlayerModel, b:PublicPlayerModel) {
        if (a.victoryPointsBreakdown.total < b.victoryPointsBreakdown.total) {
          return -1;
        }
        if (a.victoryPointsBreakdown.total > b.victoryPointsBreakdown.total) {
          return 1;
        }
        if (a.megacredits < b.megacredits) {
          return -1;
        }
        if (a.megacredits > b.megacredits) {
          return 1;
        }
        return 0;
      });
      return sorted.reverse();
    },
    winners() {
      const sortedPlayers = this.playersInPlace;
      const firstWinner = sortedPlayers[0];
      const winners: PublicPlayerModel[] = [firstWinner];
      for (let i = 1; i < sortedPlayers.length; i++) {
        if (sortedPlayers[i].victoryPointsBreakdown.total === firstWinner.victoryPointsBreakdown.total &&
                    sortedPlayers[i].megacredits === firstWinner.megacredits) {
          winners.push(sortedPlayers[i]);
        }
      }
      return winners;
    },
    isSoloGame(): boolean {
      return this.participant.players.length === 1;
    },
    vpDataset(): ReadonlyArray<DataSet> {
      return this.participant.players.map((player) => {
        return {
          label: player.name,
          data: player.victoryPointsByGeneration,
          color: player.color,
        };
      });
    },
    globalsDataset(): ReadonlyArray<DataSet> {
      const dataset: Array<DataSet> = [];

      const gpg = this.game.globalsPerGeneration;
      function getValues(param: GlobalParameter, min: number, max: number): ReadonlyArray<number> {
        return gpg.map((entry) => {
          const val = entry[param] ?? min;
          return 100 * (val - min) / (max - min);
        });
      }

      const max = getGlobalParameterMaximums(this.game.gameOptions.boardName);
      dataset.push({label: $t('Temperature'), color: 'red', data: getValues(GlobalParameter.TEMPERATURE, constants.MIN_TEMPERATURE, max.temperature)});
      dataset.push({label: $t('Oxygen'), color: 'green', data: getValues(GlobalParameter.OXYGEN, constants.MIN_OXYGEN_LEVEL, max.oxygen)});
      dataset.push({label: $t('Oceans'), color: 'blue', data: getValues(GlobalParameter.OCEANS, 0, max.oceans)});
      if (this.game.gameOptions.expansions.venus === true) {
        dataset.push({label: $t('Venus'), color: 'yellow', data: getValues(GlobalParameter.VENUS, constants.MIN_VENUS_SCALE, max.venus)});
      }
      if (this.game.gameOptions.expansions.moon === true) {
        dataset.push({label: $t('L. Habitat'), color: 'orange', data: getValues(GlobalParameter.MOON_HABITAT_RATE, 0, 8)});
        dataset.push({label: $t('L. Mining'), color: 'pink', data: getValues(GlobalParameter.MOON_MINING_RATE, 0, 8)});
        dataset.push({label: $t('L. Logistic'), color: 'purple', data: getValues(GlobalParameter.MOON_LOGISTIC_RATE, 0, 8)});
      }
      return dataset;
    },
    playerContributionsData(): Array<{player: string, color: Color, temp: number, oxygen: number, oceans: number, venus?: number, moonHabitat?: number, moonMining?: number, moonLogistic?: number, total: number}> {
      return this.participant.players.map((player) => {
        const steps = player.globalParameterSteps || {};
        const temp = steps[GlobalParameter.TEMPERATURE] || 0;
        const oxygen = steps[GlobalParameter.OXYGEN] || 0;
        const oceans = steps[GlobalParameter.OCEANS] || 0;
        const venus = steps[GlobalParameter.VENUS] || 0;
        const moonHabitat = steps[GlobalParameter.MOON_HABITAT_RATE] || 0;
        const moonMining = steps[GlobalParameter.MOON_MINING_RATE] || 0;
        const moonLogistic = steps[GlobalParameter.MOON_LOGISTIC_RATE] || 0;

        return {
          player: player.name,
          color: player.color,
          temp,
          oxygen,
          oceans,
          venus,
          moonHabitat,
          moonMining,
          moonLogistic: moonLogistic,
          total: temp + oxygen + oceans + venus + moonHabitat + moonMining + moonLogistic,
        };
      });
    },
    constants(): typeof constants {
      return constants;
    },
    tabs(): ReadonlyArray<{key: EndTab, label: string}> {
      return TABS;
    },
  },
  data(): {tileView: TileView, tab: EndTab} {
    return {
      tileView: 'show',
      tab: 'board',
    };
  },
  components: {
    FinalStandings,
    FitToBox,
    PlayerCube,
    HomeLink,
    Board,
    LogPanel,
    AppButton,
    MoonBoard,
    PlanetaryTracks,
    DeltaProjectBoard,
    VictoryPointChart,
  },
  mounted() {
    setDocumentTitle('🏁 | ' + this.game.name);
    if (getPreferences().experimental_ui) {
      setFaviconStatus('ended');
    }
  },
  methods: {
    cycleTileView(): void {
      this.tileView = nextTileView(this.tileView);
    },
    getEndGamePlayerRowColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
    getTimer(p: PublicPlayerModel): string {
      return Timer.toString(p.timer);
    },
    getCorporationName(p: PublicPlayerModel): string[] {
      const cards = p.tableau;
      const corporationCards = cards
        .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
        .map((card) => card.name);
      return corporationCards.length === 0 ? [''] : corporationCards;
    },
    translateMilestoneDetails(data: MADetail): string {
      const args = (data.messageArgs || []).map($t);
      return translateTextWithParams(data.message, args);
    },
    translateAwardDetails(data: MADetail): string {
      if ( ! data.messageArgs || data.messageArgs.length < 3) {
        console.error( // data.message: ${0} place for ${1} award (funded by ${2})
          `Award detail has not enough data.
          It must contain at least 3 arguments:
          1) a Player's place in the race for the award
          2) translatable Award name
          3) not translatable Player name
          `,
        );
        return this.translateMilestoneDetails(data);
      }
      const message: Message = {
        message: data.message,
        data: [
          {
            type: LogMessageDataType.STRING,
            value: data.messageArgs[0],
          },
          {
            type: LogMessageDataType.AWARD,
            value: data.messageArgs[1] as AwardName,
          },
          {
            type: LogMessageDataType.PLAYER,
            value: data.messageArgs[2] as Color,
          },
        ],
      };
      return translateMessage(message);
    },
  },
});

</script>
