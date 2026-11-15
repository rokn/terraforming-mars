<template>
  <div id="create-game" class="create-game tm-create">
    <SiteHeader active="new-game">
      <PreferencesIcon />
    </SiteHeader>

    <div class="tm-create-page">
      <div class="tm-create-title">
        <div class="tm-create-title-text">
          <span class="tm-create-step" v-i18n>Step 1 of 2 · Configure</span>
          <h1 class="tm-create-h1" v-i18n>New game</h1>
          <p class="tm-create-lede" v-i18n>Start from a preset, then adjust anything below.</p>
        </div>
        <div class="tm-create-presets" role="group" :aria-label="$t('Presets')">
          <button v-for="preset in PRESETS" :key="preset.key" type="button"
            :class="['tm-chip-button', 'tm-create-preset', {'tm-chip-button--on': activePreset === preset.key}]"
            :data-test="'preset-' + preset.key"
            @click="applyPreset(preset.key)"
            v-i18n>{{ preset.label }}</button>
        </div>
      </div>

      <div class="tm-create-layout">
        <div class="create-game-form create-game-options tm-create-form">

          <!-- Players -->
          <fieldset class="tm-fieldset">
            <legend class="tm-fieldset-legend" v-i18n>Players</legend>
            <span class="tm-fieldset-caption" v-i18n>1–6 players · each gets a cube color · pick who starts or leave it random</span>
            <div class="tm-segmented" role="radiogroup" :aria-label="$t('№ of Players')">
              <template v-for="pCount in [1,2,3,4,5,6]" :key="pCount">
                <input type="radio" :value="pCount" name="playersCount" v-model="playersCount" :id="pCount+'-radio'">
                <label :for="pCount+'-radio'">{{ getPlayersCountText(pCount) }}</label>
              </template>
            </div>

            <div v-for="(newPlayer, index) in getPlayers" :key="index" class="tm-player-row create-game-player" :data-color="newPlayer.color">
              <div class="tm-player-main">
                <PlayerCube :color="newPlayer.color" :size="26" class="tm-player-cube" />
                <label class="tm-player-name">
                  <span class="tm-field-caption">{{ getPlayerNamePlaceholder(index) }}</span>
                  <input class="form-input create-game-player-name" :placeholder="getPlayerNamePlaceholder(index)" v-model="newPlayer.name">
                </label>
                <label class="tm-pill" v-if="!randomFirstPlayer">
                  <input type="radio" name="firstIndex" :value="index + 1" v-model="firstIndex">
                  <span v-i18n>Goes First?</span>
                </label>
              </div>
              <div class="tm-player-extra">
                <div class="create-game-page-color-row tm-color-row" role="radiogroup" :aria-label="$t('Color')">
                  <template v-for="color in PLAYER_COLORS" :key="color">
                    <input type="radio" :value="color" :name="'playerColor' + (index + 1)" v-model="newPlayer.color" :id="'radioBox' + color + (index + 1)">
                    <label :for="'radioBox' + color + (index + 1)" :title="$t(color)">
                      <PlayerCube :color="color" :size="18" />
                    </label>
                  </template>
                </div>
                <label class="tm-inline-field">
                  <span v-i18n>TR Boost</span>&nbsp;<a :href="wikiUrls.trBoost" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                  <input type="number" class="form-input player-handicap" min="0" :max="10" v-model.number="newPlayer.handicap">
                </label>
                <label v-if="isBeginnerToggleEnabled" class="tm-check create-game-beginner-option-label">
                  <input type="checkbox" v-model="newPlayer.beginner">
                  <span v-i18n>Beginner?</span>&nbsp;<a :href="wikiUrls.beginnerCorporation" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                </label>
              </div>
            </div>

            <label v-if="playersCount > 1" class="tm-check" for="randomFirstPlayer-checkbox">
              <input type="checkbox" v-model="randomFirstPlayer" id="randomFirstPlayer-checkbox">
              <span v-i18n>Random first player</span>
            </label>
          </fieldset>

          <!-- Board -->
          <fieldset class="tm-fieldset">
            <legend class="tm-fieldset-legend" v-i18n>Landing region</legend>
            <div class="tm-board-tiles">
              <label v-for="(board, i) in QUICK_BOARDS" :key="board.name"
                :class="['tm-board-tile', {'tm-board-tile--on': isOnlyBoard(board.name)}]"
                :for="'quickBoard-' + i">
                <span class="tm-board-tile-top">
                  <svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true">
                    <defs>
                      <radialGradient :id="'tmBoardPlanet' + i" cx="40%" cy="35%" r="70%">
                        <stop offset="0" stop-color="#C9602F" />
                        <stop offset="0.6" stop-color="#8E3519" />
                        <stop offset="1" stop-color="#3A1409" />
                      </radialGradient>
                    </defs>
                    <circle cx="32" cy="32" r="30" :fill="'url(#tmBoardPlanet' + i + ')'" />
                    <polygon v-for="(hex, h) in BOARD_HEXES" :key="h" :points="hex" :fill="board.hexes[h]" stroke="#F1E2C8" stroke-opacity="0.4" />
                  </svg>
                  <input type="radio" name="quickBoard" :id="'quickBoard-' + i" :checked="isOnlyBoard(board.name)" @change="boards = [board.name]">
                </span>
                <span class="tm-board-tile-name capitalized" v-i18n>{{ board.name }}</span>
                <span class="tm-board-tile-desc" v-i18n>{{ board.description }}</span>
              </label>
              <div :class="['tm-board-tile', 'tm-board-tile--more', {'tm-board-tile--on': !isQuickBoardChosen}]">
                <span class="tm-board-tile-name" v-i18n>More maps</span>
                <span class="tm-board-tile-desc" v-i18n>Every official and fan-made map, random boards and shuffled tiles.</span>
                <BoardSelector v-model:boards="boards" v-model:shuffleMap="shuffleMapOption" class="tm-board-selector" />
              </div>
            </div>
          </fieldset>

          <!-- Expansions -->
          <fieldset class="tm-fieldset">
            <legend class="tm-fieldset-legend" v-i18n>Expansion modules</legend>
            <label class="tm-check tm-check--strong" for="allOfficialExpansions-checkbox">
              <input type="checkbox" name="allOfficialExpansions" id="allOfficialExpansions-checkbox" v-model="allOfficialExpansions">
              <span v-i18n>All official expansions</span>
            </label>
            <template v-for="group in MODULE_GROUPS" :key="group.label">
              <div v-if="group.label !== 'Official'" class="tm-subsection-label create-game-subsection-label" v-i18n>{{ group.label }}</div>
              <div class="tm-module-grid">
                <div v-for="m in group.modules" :key="m.key" :class="['tm-module', {'tm-module--on': expansions[m.key]}]" :data-module="m.key">
                  <label :for="m.id" class="tm-module-head">
                    <span :class="'create-game-expansion-icon ' + m.icon"></span>
                    <span class="tm-module-text">
                      <span class="tm-module-name">
                        <span v-i18n>{{ m.name }}</span>
                        <span v-if="m.alpha" class="tm-module-alpha" title="Alpha — work in progress">&nbsp;(&#945;)</span>
                        <a v-if="m.wiki" :href="wikiUrls[m.key]" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&nbsp;&#9432;</a>
                      </span>
                      <span class="tm-module-desc" v-i18n>{{ m.description }}</span>
                    </span>
                    <input type="checkbox" :name="m.key" :id="m.id" v-model="expansions[m.key]">
                  </label>

                  <div v-if="expansions[m.key] && MODULES_WITH_OPTIONS.includes(m.key)" class="tm-module-options">
                    <template v-if="m.key === 'prelude'">
                      <label class="tm-inline-field" for="startingPreludeNum-checkbox">
                        <span v-i18n>Starting Preludes</span>
                        <input type="number" class="form-input create-game-corporations-count" min="4" :max="8" v-model="startingPreludes" id="startingPreludeNum-checkbox">
                      </label>
                      <label class="tm-check" for="twoCorps-checkbox" title="Always gain the Merger Prelude card (will be given post-draft)">
                        <input type="checkbox" v-model="twoCorpsVariant" id="twoCorps-checkbox">
                        <span v-i18n>Merger</span>&nbsp;<a :href="wikiUrls.merger" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                    </template>

                    <template v-if="m.key === 'venus'">
                      <label class="tm-check" for="altVenusBoard-checkbox">
                        <input type="checkbox" v-model="altVenusBoard" id="altVenusBoard-checkbox">
                        <span v-i18n>Alt. Venus Board</span>&nbsp;<a :href="wikiUrls.alternativeVenusBoard" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                      <label v-if="playersCount > 1" class="tm-check" for="requiresVenusTrackCompletion-checkbox">
                        <input type="checkbox" v-model="requiresVenusTrackCompletion" id="requiresVenusTrackCompletion-checkbox">
                        <span v-i18n>Mandatory Venus Terraforming</span>&nbsp;<a :href="wikiUrls.venusTerraforming" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                    </template>

                    <template v-if="m.key === 'turmoil'">
                      <label class="tm-check" for="politicalAgendas-checkbox">
                        <input type="checkbox" name="politicalAgendas" id="politicalAgendas-checkbox" :checked="isPoliticalAgendasExtensionEnabled" @change="politicalAgendasExtensionToggle()">
                        <span class="create-game-expansion-icon expansion-icon-agendas"></span>
                        <span v-i18n>Agendas</span>&nbsp;<a href="https://www.notion.so/Political-Agendas-8c6b0b018a884692be29b3ef44b340a9" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                      <div class="tm-segmented tm-segmented--small" v-if="isPoliticalAgendasExtensionEnabled">
                        <input type="radio" name="agendaStyle" v-model="politicalAgendasExtension" :value="getPoliticalAgendasExtensionAgendaStyle('random')" id="randomAgendaStyle-radio">
                        <label class="label-agendaStyle agendaStyle-random" for="randomAgendaStyle-radio">
                          <span class="agendas-text" v-i18n>{{ getPoliticalAgendasExtensionAgendaStyle('random') }}</span>
                        </label>
                        <input type="radio" name="agendaStyle" v-model="politicalAgendasExtension" :value="getPoliticalAgendasExtensionAgendaStyle('chairman')" id="chairmanAgendaStyle-radio">
                        <label class="label-agendaStyle agendaStyle-chairman" for="chairmanAgendaStyle-radio">
                          <span class="agendas-text" v-i18n>{{ getPoliticalAgendasExtensionAgendaStyle('chairman') }}</span>
                        </label>
                      </div>
                      <label class="tm-check" for="removeNegativeEvent-checkbox">
                        <input type="checkbox" v-model="removeNegativeGlobalEventsOption" id="removeNegativeEvent-checkbox">
                        <span v-i18n>Remove negative Global Events</span>&nbsp;<a :href="wikiUrls.removeNegativeGlobalEvents" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                    </template>

                    <template v-if="m.key === 'ares'">
                      <label class="tm-check" for="aresExtremeVariantVariant-checkbox">
                        <input type="checkbox" v-model="aresExtremeVariant" id="aresExtremeVariantVariant-checkbox">
                        <span v-i18n>Extreme</span>&nbsp;<a :href="wikiUrls.aresExtreme" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                    </template>

                    <template v-if="m.key === 'moon'">
                      <label class="tm-check" for="requiresMoonTrackCompletion-checkbox">
                        <input type="checkbox" v-model="requiresMoonTrackCompletion" id="requiresMoonTrackCompletion-checkbox">
                        <span v-i18n>Mandatory Moon Terraforming</span>
                      </label>
                      <label class="tm-check" for="moonStandardProjectVariant2-checkbox">
                        <input type="checkbox" v-model="moonStandardProjectVariant" id="moonStandardProjectVariant2-checkbox">
                        <span v-i18n>Standard Project Variant #2</span>&nbsp;<a :href="wikiUrls.moonStandardProjectVariant" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                      <label class="tm-check" for="moonStandardProjectVariant1-checkbox">
                        <input type="checkbox" v-model="moonStandardProjectVariant1" id="moonStandardProjectVariant1-checkbox">
                        <span v-i18n>Standard Project Variant #1</span>&nbsp;<a :href="wikiUrls.moonStandardProjectVariant" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                      </label>
                    </template>

                    <template v-if="m.key === 'ceo'">
                      <label class="tm-inline-field" for="startingCEONum-checkbox">
                        <span v-i18n>Starting CEOs</span>
                        <input type="number" class="form-input create-game-corporations-count" min="1" :max="6" v-model="startingCeos" id="startingCEONum-checkbox">
                      </label>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </fieldset>

          <!-- Rules -->
          <fieldset class="tm-fieldset">
            <legend class="tm-fieldset-legend" v-i18n>Rules &amp; options</legend>
            <div class="tm-rule-grid">
              <template v-if="playersCount > 1">
                <label class="tm-rule" for="draft-checkbox">
                  <input type="checkbox" name="draftVariant" v-model="draftVariant" id="draft-checkbox">
                  <span class="tm-rule-text">
                    <span class="tm-rule-name" v-i18n>Draft variant</span>
                    <span class="tm-rule-desc" v-i18n>Pass research cards around the table</span>
                  </span>
                </label>
                <div class="tm-rule">
                  <label class="tm-rule-main" for="initialDraft-checkbox">
                    <input type="checkbox" name="initialDraft" v-model="initialDraft" id="initialDraft-checkbox">
                    <span class="tm-rule-text">
                      <span class="tm-rule-name"><span v-i18n>Initial Draft variant</span>&nbsp;<a :href="wikiUrls.initialDraft" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a></span>
                      <span class="tm-rule-desc" v-i18n>Draft your starting cards too</span>
                    </span>
                  </label>
                  <div class="tm-rule-sub" v-if="initialDraft && (expansions.prelude || expansions.ceo)">
                    <label v-if="expansions.prelude" class="tm-check" for="preludeDraft-checkbox">
                      <input type="checkbox" name="preludeDraft" v-model="preludeDraftVariant" id="preludeDraft-checkbox">
                      <span v-i18n>Prelude Draft</span>
                    </label>
                    <label v-if="expansions.ceo" class="tm-check" for="ceosDraft-checkbox">
                      <input type="checkbox" name="ceosDraft" v-model="ceosDraftVariant" id="ceosDraft-checkbox">
                      <span v-i18n>CEO Draft</span>
                    </label>
                  </div>
                </div>
              </template>

              <label class="tm-rule" for="WGT-checkbox">
                <input type="checkbox" v-model="solarPhaseOption" id="WGT-checkbox">
                <span class="tm-rule-text">
                  <span class="tm-rule-name"><span v-i18n>World Government Terraforming</span>&nbsp;<a :href="wikiUrls.worldGovernmentTerraforming" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a></span>
                  <span class="tm-rule-desc" v-i18n>Neutral terraforming each generation</span>
                </span>
              </label>

              <label class="tm-rule" for="timer-checkbox">
                <input type="checkbox" v-model="showTimers" id="timer-checkbox">
                <span class="tm-rule-text">
                  <span class="tm-rule-name" v-i18n>Show timers</span>
                  <span class="tm-rule-desc" v-i18n>Visible clock for every player</span>
                </span>
              </label>

              <div class="tm-rule">
                <label class="tm-rule-main" for="undo-checkbox">
                  <input type="checkbox" v-model="undoOption" id="undo-checkbox">
                  <span class="tm-rule-text">
                    <span class="tm-rule-name"><span v-i18n>Allow undo</span>&nbsp;<a :href="wikiUrls.allowUndo" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a></span>
                    <span class="tm-rule-desc" v-i18n>Take back your last action</span>
                  </span>
                </label>
                <div v-if="undoOption" class="tm-rule-note">
                  <span v-i18n>Undo is now in best effort support.</span>
                  <a href="https://github.com/terraforming-mars/terraforming-mars/discussions/7647" target="_blank">&#9432;</a>
                  <span v-i18n>No effort will be spent to fix it.</span>
                </div>
              </div>

              <label v-if="playersCount === 1" class="tm-rule" for="soloTR-checkbox">
                <input type="checkbox" v-model="soloTR" id="soloTR-checkbox">
                <span class="tm-rule-text">
                  <span class="tm-rule-name"><span v-i18n>63 TR solo mode</span>&nbsp;<a :href="wikiUrls.trSoloMode" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a></span>
                  <span class="tm-rule-desc" v-i18n>Win by reaching 63 TR instead of finishing the globals</span>
                </span>
              </label>

              <div v-if="playersCount > 1" class="tm-rule tm-rule--goals">
                <span class="tm-rule-text">
                  <span class="tm-rule-desc" v-i18n>Which milestones and awards are in play</span>
                </span>
                <GoalButton v-model="goals" :expansions="expansions" />
              </div>
            </div>

            <details class="tm-advanced">
              <summary class="tm-advanced-summary">
                <span v-i18n>Advanced options</span>
                <span v-if="advancedActiveCount > 0" class="tm-advanced-count">{{ advancedActiveCount }}</span>
              </summary>
              <div class="tm-advanced-body">
                <label class="tm-inline-field" for="startingCorpNum-checkbox">
                  <span v-i18n>Starting Corporations</span>
                  <input type="number" class="form-input create-game-corporations-count" min="1" :max="6" v-model="startingCorporations" id="startingCorpNum-checkbox">
                </label>

                <template v-if="playersCount > 1">
                  <label class="tm-check" for="realTimeVP-checkbox">
                    <input type="checkbox" name="showOtherPlayersVP" v-model="showOtherPlayersVP" id="realTimeVP-checkbox">
                    <span v-i18n>Show real-time VP</span>&nbsp;<a :href="wikiUrls.showRealtimeVP" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                  </label>
                  <label class="tm-check" for="fastMode-checkbox">
                    <input type="checkbox" v-model="fastModeOption" id="fastMode-checkbox">
                    <span v-i18n>Fast mode</span>&nbsp;<a :href="wikiUrls.fastMode" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                  </label>
                </template>

                <div class="tm-advanced-group">
                  <label class="tm-check" for="escapevelocity-checkbox">
                    <input type="checkbox" v-model="escapeVelocityMode" id="escapevelocity-checkbox">
                    <span class="create-game-expansion-icon expansion-icon-escape-velocity"></span>
                    <span v-i18n>Escape Velocity</span>&nbsp;<a :href="wikiUrls.escapeVelocity" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                  </label>
                  <div v-show="escapeVelocityMode" class="tm-advanced-fields">
                    <label class="tm-inline-field" for="escapeThreshold-checkbox">
                      <span v-i18n>After</span>
                      <input type="number" class="form-input create-game-corporations-count" step="5" min="0" :max="180" v-model="escapeVelocityThreshold" id="escapeThreshold-checkbox">
                      <span v-i18n>min</span>
                    </label>
                    <label class="tm-inline-field" for="escapeBonusSeconds-checkbox">
                      <span v-i18n>Plus</span>
                      <input type="number" class="form-input create-game-corporations-count" step="1" min="1" :max="10" v-model="escapeVelocityBonusSeconds" id="escapeBonusSeconds-checkbox">
                      <span v-i18n>seconds per action</span>
                    </label>
                    <label class="tm-inline-field" for="escapePeriod-checkbox">
                      <span v-i18n>Reduce</span>
                      <input type="number" class="form-input create-game-corporations-count" min="1" :max="10" v-model="escapeVelocityPenalty" id="escapePeriod-checkbox">
                      <span v-i18n>VP every</span>
                      <input type="number" class="form-input create-game-corporations-count" min="1" :max="10" v-model="escapeVelocityPeriod" id="escapePeriod2-checkbox">
                      <span v-i18n>min</span>
                    </label>
                  </div>
                </div>

                <div class="tm-advanced-group">
                  <label class="tm-check" for="seeded-checkbox">
                    <input type="checkbox" v-model="seededGame" id="seeded-checkbox">
                    <span v-i18n>Set Predefined Game</span>&nbsp;<a :href="wikiUrls.setPredefinedGame" class="tooltip" v-i18n data-tooltip="Link opens in a new tab/window" target="_blank">&#9432;</a>
                  </label>
                  <div v-if="seededGame" class="tm-advanced-fields">
                    <input type="text" class="form-input" name="clonedGamedId" v-model="clonedGameId" :aria-label="$t('Game id')">
                  </div>
                </div>
              </div>
            </details>
          </fieldset>

          <!-- Filters -->
          <fieldset class="tm-fieldset">
            <legend class="tm-fieldset-legend" v-i18n>Filter</legend>
            <span class="tm-fieldset-caption" v-i18n>Choose exactly which corporations, preludes, colonies and cards can appear</span>
            <div class="tm-filter-row">
              <label class="tm-filter" for="customCorps-checkbox">
                <input type="checkbox" v-model="showCorporationList" id="customCorps-checkbox">
                <span v-i18n>Custom Corporation list</span>
                <span v-if="customCorporations.length" class="tm-filter-count">{{ customCorporations.length }}</span>
              </label>
              <label v-if="expansions.prelude" class="tm-filter" for="customPreludes-checkbox">
                <input type="checkbox" v-model="showPreludesList" id="customPreludes-checkbox">
                <span v-i18n>Custom Preludes list</span>
                <span v-if="customPreludes.length" class="tm-filter-count">{{ customPreludes.length }}</span>
              </label>
              <label v-if="expansions.ceo" class="tm-filter" for="customCeos-checkbox">
                <input type="checkbox" v-model="showCeosList" id="customCeos-checkbox">
                <span v-i18n>Custom CEOs list</span>
                <span v-if="customCeos.length" class="tm-filter-count">{{ customCeos.length }}</span>
              </label>
              <label v-if="expansions.colonies" class="tm-filter" for="customColonies-checkbox">
                <input type="checkbox" v-model="showColoniesList" id="customColonies-checkbox">
                <span v-i18n>Custom Colonies list</span>
                <span v-if="customColonies.length" class="tm-filter-count">{{ customColonies.length }}</span>
              </label>
              <label class="tm-filter" for="bannedCards-checkbox">
                <input type="checkbox" v-model="showBannedCards" id="bannedCards-checkbox">
                <span v-i18n>Exclude some cards</span>
                <span v-if="bannedCards.length" class="tm-filter-count">{{ bannedCards.length }}</span>
              </label>
              <label class="tm-filter" for="includedCards-checkbox">
                <input type="checkbox" v-model="showIncludedCards" id="includedCards-checkbox">
                <span v-i18n>Include some cards</span>
                <span v-if="includedCards.length" class="tm-filter-count">{{ includedCards.length }}</span>
              </label>
            </div>
          </fieldset>

          <div class="tm-create-links">
            <a :href="wikiUrls.changelog" class="changelog" target="_blank" v-i18n>Read our changelog to get the latest updates.</a>
            <span class="discord-invite">
              <span v-i18n>Looking for people to play with</span>? <a :href="constants.DISCORD_INVITE" target="_blank" v-i18n>Join us on Discord</a>
            </span>
          </div>
        </div>

        <!-- Manifest -->
        <aside class="tm-manifest" :aria-label="$t('Manifest')">
          <div class="tm-panel">
            <div class="tm-panel-inner tm-manifest-inner">
              <div class="tm-manifest-head">
                <h2 class="tm-section-title--large" v-i18n>Manifest</h2>
                <span :class="['tm-manifest-status', 'tm-manifest-status--' + manifestStatus]" v-i18n>{{ MANIFEST_STATUS_LABELS[manifestStatus] }}</span>
              </div>
              <div class="tm-manifest-list">
                <div class="tm-manifest-row">
                  <span class="tm-manifest-key" v-i18n>Players</span>
                  <span class="tm-manifest-cubes">
                    <PlayerCube v-for="(p, i) in getPlayers" :key="i" :color="p.color" :size="14" />
                    <strong>{{ playersCount }}</strong>
                  </span>
                </div>
                <div class="tm-manifest-row">
                  <span class="tm-manifest-key" v-i18n>Region</span>
                  <strong class="capitalized">{{ regionLabel }}</strong>
                </div>
                <div v-if="playersCount > 1" class="tm-manifest-row">
                  <span class="tm-manifest-key" v-i18n>First player</span>
                  <strong>{{ firstPlayerLabel }}</strong>
                </div>
                <div class="tm-manifest-row tm-manifest-row--chips">
                  <span class="tm-manifest-key"><span v-i18n>Modules</span> · {{ manifestModules.length }}</span>
                  <span class="tm-manifest-chips">
                    <span v-for="name in manifestModules" :key="name" class="tm-manifest-chip" v-i18n>{{ name }}</span>
                  </span>
                </div>
                <div class="tm-manifest-row tm-manifest-row--chips">
                  <span class="tm-manifest-key"><span v-i18n>Rules</span> · {{ manifestRules.length }}</span>
                  <span class="tm-manifest-chips">
                    <span v-for="name in manifestRules" :key="name" class="tm-manifest-chip" v-i18n>{{ name }}</span>
                  </span>
                </div>
              </div>

              <div v-for="hint in manifestHints" :key="hint" class="tm-hint" data-test="manifest-hint">
                <span class="tm-hint-stripe"></span>
                <span class="tm-hint-text" v-i18n>{{ hint }}</span>
              </div>

              <div class="create-game-action tm-manifest-actions">
                <AppButton class="tm-create-submit" title="Create game" size="big" @click="createGame" :disabled="hasBlockingValidationErrors" />
                <button v-if="hasBlockingValidationErrors" type="button" class="tm-manifest-problems create-game-custom-preludes-warning create-game-validation-blocker" @click="showValidationErrors = true">
                  <span aria-hidden="true">&#9888;&#xFE0E;</span> <span v-i18n>Show problems</span>
                </button>
                <button v-else-if="hasValidationProblems" type="button" class="tm-manifest-problems create-game-validation-warning" @click="showValidationErrors = true">
                  <span aria-hidden="true">&#9888;&#xFE0E;</span> <span v-i18n>Show warnings</span>
                </button>
                <div class="tm-manifest-secondary">
                  <label class="tm-button tm-button--secondary tm-manifest-file">
                    <i class="icon icon-upload"></i><span v-i18n>Load</span>
                    <input style="display: none" type="file" accept=".json" id="settings-file" ref="file" @change="uploadSettings()">
                  </label>
                  <button type="button" class="tm-button tm-button--secondary" @click="downloadSettings()">
                    <i class="icon icon-download"></i><span v-i18n>Save</span>
                  </button>
                  <AppButton class="tm-create-reset" title="Reset" size="big" @click="resetSettings" />
                </div>
                <label class="tm-check">
                  <input type="checkbox" v-model="rememberSettings" data-test="remember-settings">
                  <span v-i18n>Remember settings</span>
                </label>
              </div>
              <span class="tm-manifest-foot" v-i18n>Each player gets a private link on the next screen.</span>
            </div>
          </div>
        </aside>
      </div>
    </div>

    <CorporationsFilter
      ref="corporationsFilter"
      v-show="showCorporationList"
      v-if="showCorporationList"
      @corporation-list-changed="updateCustomCorporations"
      :expansions="expansions"
      :selected="customCorporations"
      @close="showCorporationList = false"
    />

    <PreludesFilter
      ref="preludesFilter"
      v-show="showPreludesList"
      v-if="showPreludesList"
      @prelude-list-changed="updateCustomPreludes"
      :expansions="expansions"
      :selected="customPreludes"
      @close="showPreludesList = false"
    />

    <ColoniesFilter
      ref="coloniesFilter"
      v-show="showColoniesList"
      v-if="showColoniesList"
      @colonies-list-changed="updateCustomColonies"
      :expansions="expansions"
      :selected="customColonies"
      @close="showColoniesList = false"
    />

    <CeosFilter
      ref="ceosFilter"
      v-show="showCeosList"
      v-if="showCeosList"
      @ceo-list-changed="updateCustomCeos"
      :expansions="expansions"
      :selected="customCeos"
      @close="showCeosList = false"
    />

    <CardsFilter
      v-if="showBannedCards"
      @cards-list-changed="updateBannedCards"
      :title="'Cards to exclude from the game'"
      :hint="'Start typing the card name to exclude'"
      :selected="bannedCards"
      @close="showBannedCards = false"
    />

    <CardsFilter
      v-if="showIncludedCards"
      @cards-list-changed="updateIncludedCards"
      :title="'Cards to include in the game'"
      :hint="'Start typing the card name to include'"
      :selected="includedCards"
      @close="showIncludedCards = false"
    />
    <ValidationErrorsPopup v-if="showValidationErrors" :errors="validationErrors" @close="showValidationErrors = false" />
  </div>
</template>


<script lang="ts">
import * as constants from '@/common/constants';

import {defineComponent, nextTick} from 'vue';
import {Color, PLAYER_COLORS} from '@/common/Color';
import {CardName} from '@/common/cards/CardName';
import CeosFilter from '@/client/components/create/CeosFilter.vue';
import BoardSelector from '@/client/components/create/BoardSelector.vue';
import CorporationsFilter from '@/client/components/create/CorporationsFilter.vue';
import PreludesFilter from '@/client/components/create/PreludesFilter.vue';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import ColoniesFilter from '@/client/components/create/ColoniesFilter.vue';
import GoalButton from '@/client/components/create/goals/GoalButton.vue';
import {toGameOptions} from '@/client/components/create/goals/conversions';
import {ColonyName} from '@/common/colonies/ColonyName';
import CardsFilter from '@/client/components/create/CardsFilter.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {playerColorClass} from '@/common/utils/utils';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {GameId, JSONObject} from '@/common/Types';
import {AgendaStyle} from '@/common/turmoil/Types';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import {getCard} from '@/client/cards/ClientCardManifest';
import {NewGameConfig, NewPlayerModel} from '@/common/game/NewGameConfig';
import {vueRoot} from '@/client/components/vueRoot';
import {CreateGameModel} from './CreateGameModel';
import {paths} from '@/common/app/paths';
import {JSONProcessor} from './JSONProcessor';
import {defaultCreateGameModel} from './defaultCreateGameModel';
import {createGameSettingsStorage} from './createGameSettingsStorage';
import {getColony} from '@/client/colonies/ClientColonyManifest';
import {getAward, getMilestone} from '@/client/MilestoneAwardManifest';
import {RULEBOOK_URLS, WIKI_URLS} from '@/client/utils/WikiLinks';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {sanitizeEscapeVelocityOptions} from '@/common/game/escapeVelocity';
import {validateNewGameConfig, validationDetails, ValidationErrors} from '@/common/game/validateNewGameConfig';
import ValidationErrorsPopup from './ValidationErrorsPopup.vue';
import {getPreferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import SiteHeader from '@/client/components/common/SiteHeader.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {EXPANSIONS, Expansion} from '@/common/cards/GameModule';
import {BoardName} from '@/common/boards/BoardName';

/* An expansion's toggle tile on the form. */
type ModuleTile = {
  key: Expansion;
  /* The checkbox's element id. */
  id: string;
  name: string;
  description: string;
  /* The CSS class of the expansion's icon. */
  icon: string;
  /* True when the tile links to the expansion's wiki page. */
  wiki?: boolean;
  /* True when the expansion is still in development. */
  alpha?: boolean;
};

const MODULE_GROUPS: ReadonlyArray<{label: string, modules: ReadonlyArray<ModuleTile>}> = [
  {
    label: 'Official',
    modules: [
      {key: 'corpera', id: 'corporateEra-checkbox', name: 'Corporate Era', description: 'Full corporation and project card set', icon: 'expansion-icon-CE'},
      {key: 'prelude', id: 'prelude-checkbox', name: 'Prelude', description: 'Head-start cards before generation 1', icon: 'expansion-icon-prelude'},
      {key: 'prelude2', id: 'prelude2-checkbox', name: 'Prelude 2', description: 'More preludes, corporations and project cards', icon: 'expansion-icon-prelude2'},
      {key: 'venus', id: 'venusNext-checkbox', name: 'Venus Next', description: 'Adds Venus as a fifth global parameter', icon: 'expansion-icon-venus'},
      {key: 'colonies', id: 'colonies-checkbox', name: 'Colonies', description: 'Colony tiles, trade fleets and income', icon: 'expansion-icon-colony'},
      {key: 'turmoil', id: 'turmoil-checkbox', name: 'Turmoil', description: 'Political parties, delegates and global events', icon: 'expansion-icon-turmoil'},
      {key: 'promo', id: 'promo-checkbox', name: 'Promos', description: 'Promotional corporations and cards', icon: 'expansion-icon-promo', wiki: true},
    ],
  },
  {
    label: 'Fan-made',
    modules: [
      {key: 'ares', id: 'ares-checkbox', name: 'Ares', description: 'Hazard tiles and adjacency bonuses', icon: 'expansion-icon-ares', wiki: true},
      {key: 'community', id: 'communityCards-checkbox', name: 'Community', description: 'Fan-made corporations and cards', icon: 'expansion-icon-community', wiki: true},
      {key: 'moon', id: 'themoon-checkbox', name: 'The Moon', description: 'A second board with its own parameters', icon: 'expansion-icon-themoon', wiki: true},
      {key: 'pathfinders', id: 'pathfinders-checkbox', name: 'Pathfinders', description: 'Planetary tracks that reward tags', icon: 'expansion-icon-pathfinders', wiki: true},
      {key: 'ceo', id: 'ceo-checkbox', name: 'CEOs', description: 'Leaders with one-time and ongoing abilities', icon: 'expansion-icon-ceo', wiki: true},
      {key: 'starwars', id: 'starwars-checkbox', name: 'Star Wars', description: 'Cards themed on the Star Wars saga', icon: 'expansion-icon-starwars', wiki: true},
      {key: 'underworld', id: 'underworld-checkbox', name: 'Underworld 2', description: 'Excavation, corruption and underground resources', icon: 'expansion-icon-underworld', wiki: true},
      {key: 'deltaProject', id: 'deltaProject-checkbox', name: 'Delta Project', description: 'An expansion still in development', icon: 'expansion-icon-deltaProject', wiki: true, alpha: true},
    ],
  },
];

/* Expansions whose tile shows extra settings while the expansion is on. */
const MODULES_WITH_OPTIONS: ReadonlyArray<Expansion> = ['prelude', 'venus', 'turmoil', 'ares', 'moon', 'ceo'];

const PRESET_KEYS = ['base', 'recommended', 'official'] as const;
/* A named set of expansions that one click turns on. */
type Preset = typeof PRESET_KEYS[number];
const PRESET_EXPANSIONS: Record<Preset, ReadonlyArray<Expansion>> = {
  base: ['corpera'],
  recommended: ['corpera', 'prelude', 'venus', 'promo'],
  official: ['corpera', 'prelude', 'prelude2', 'venus', 'colonies', 'turmoil', 'promo'],
};
const PRESETS: ReadonlyArray<{key: Preset, label: string}> = [
  {key: 'base', label: 'Base game'},
  {key: 'recommended', label: 'Recommended'},
  {key: 'official', label: 'Everything official'},
];

/* The three classic boards, offered as tiles. Every board stays reachable through the board selector. */
const QUICK_BOARDS: ReadonlyArray<{name: BoardName, description: string, hexes: ReadonlyArray<string>}> = [
  {name: BoardName.THARSIS, description: 'The original region. Best for first games.', hexes: ['#4A8A42', '#2D63A0', '#55585F']},
  {name: BoardName.HELLAS, description: 'Southern region with its own milestones and awards.', hexes: ['#2D63A0', '#2D63A0', '#4A8A42']},
  {name: BoardName.ELYSIUM, description: 'Northern region with its own milestones and awards.', hexes: ['#55585F', '#4A8A42', '#2D63A0']},
];

function hexPoints(cx: number, cy: number): string {
  const points = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 180) * (60 * k - 90);
    points.push((cx + 9 * Math.cos(a)).toFixed(1) + ',' + (cy + 9 * Math.sin(a)).toFixed(1));
  }
  return points.join(' ');
}
const BOARD_HEXES = [hexPoints(24, 26), hexPoints(40, 26), hexPoints(32, 40)];

/* How ready the settings are to create a game. */
type ManifestStatus = 'ready' | 'warning' | 'blocked';
const MANIFEST_STATUS_LABELS: Record<ManifestStatus, string> = {
  ready: 'Ready',
  warning: 'Check warnings',
  blocked: 'Needs fixing',
};

type Refs = {
  file: HTMLInputElement;
};

type FormModel = {
  showValidationErrors: boolean;
  preludeToggled: boolean;
  uploading: boolean;
  previousViewport: string;
};

export default defineComponent({
  name: 'CreateGameForm',
  data(): CreateGameModel & FormModel {
    return {
      ...defaultCreateGameModel(),
      showValidationErrors: false,
      preludeToggled: false,
      uploading: false,
      previousViewport: '',
    };
  },
  components: {
    AppButton,
    CardsFilter,
    CeosFilter,
    ColoniesFilter,
    BoardSelector,
    GoalButton,
    CorporationsFilter,
    PreludesFilter,
    PlayerCube,
    PreferencesIcon,
    SiteHeader,
    ValidationErrorsPopup,
  },
  watch: {
    allOfficialExpansions(value: boolean) {
      this.expansions.corpera = value;
      this.expansions.prelude = value;
      this.expansions.venus = value;
      this.expansions.colonies = value;
      this.expansions.turmoil = value;
      this.expansions.prelude2 = value;
      this.expansions.promo = value;
      this.solarPhaseOption = value;
    },
    'expansions.venus': function(value: boolean) {
      this.solarPhaseOption = value;
    },
    'expansions.turmoil': function(value: boolean) {
      if (value === false) {
        this.politicalAgendasExtension = 'Standard';
      }
    },
    initialDraft(value: boolean) {
      if (value === true && this.preludeDraftVariant === undefined) {
        this.preludeDraftVariant = true;
      }
      if (value === true && this.ceosDraftVariant === undefined) {
        this.ceosDraftVariant = true;
      }
    },
    'expansions.prelude': function(value: boolean) {
      if (value === true && this.preludeDraftVariant === undefined) {
        this.preludeDraftVariant = true;
      }
    },
    'expansions.prelude2': function(value: boolean) {
      if (value === true && this.preludeToggled === false && this.uploading === false) {
        this.expansions.prelude = true;
        this.preludeToggled = true;
      }
    },
    'expansions.deltaProject': function(value: boolean) {
      if (value === true && this.preludeToggled === false && this.uploading === false) {
        this.expansions.prelude = true;
        this.preludeToggled = true;
      }
    },
    playersCount(value: number) {
      if (value === 1) {
        this.expansions.corpera = true;
      }
    },
  },
  mounted() {
    setDocumentTitle('Create New Game');
    this.restoreLastSettings();

    // Set the viewport width to width=device-width on the create game form so mobile browsers use their actual CSS viewport width.
    // The current global viewport is width=1260, which prevents the create game form from using the device width on phones.
    // This is a temporary solution in order to make this edit scoped to the create game form.
    // TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport !== null) {
      this.previousViewport = viewport.getAttribute('content') ?? '';
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, viewport-fit=cover',
      );
    }
  },
  beforeUnmount() {
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute('content', this.previousViewport);
  },
  computed: {
    rememberSettings: {
      get(): boolean {
        return getPreferences().remember_create_game_settings;
      },
      set(value: boolean) {
        PreferencesManager.INSTANCE.set('remember_create_game_settings', value);
      },
    },
    wikiUrls(): typeof RULEBOOK_URLS & typeof WIKI_URLS {
      return {...RULEBOOK_URLS, ...WIKI_URLS};
    },
    /**
     * The game settings, as they'd be sent to the server.
     *
     * serializeSettings finishes the players and the escape velocity values, and checks the cloned game.
     */
    newGameConfig(): NewGameConfig {
      return {
        ...toGameOptions(this.goals),
        players: this.players.slice(0, this.playersCount),
        expansions: this.expansions,
        draftVariant: this.draftVariant,
        showOtherPlayersVP: this.showOtherPlayersVP,
        customCorporationsList: this.customCorporations,
        customColoniesList: this.customColonies,
        customCeos: this.customCeos,
        customPreludes: this.customPreludes,
        bannedCards: this.bannedCards,
        includedCards: this.includedCards,
        boards: this.boards,
        seed: this.seed,
        solarPhaseOption: this.solarPhaseOption,
        aresExtremeVariant: this.aresExtremeVariant,
        politicalAgendasExtension: this.politicalAgendasExtension,
        undoOption: this.undoOption,
        showTimers: this.showTimers,
        fastModeOption: this.fastModeOption,
        removeNegativeGlobalEventsOption: this.removeNegativeGlobalEventsOption,
        startingCorporations: this.startingCorporations,
        soloTR: this.soloTR,
        clonedGamedId: this.seededGame ? this.clonedGameId : undefined,
        initialDraft: this.initialDraft,
        preludeDraftVariant: this.preludeDraftVariant ?? false,
        ceosDraftVariant: this.ceosDraftVariant ?? false,
        shuffleMapOption: this.shuffleMapOption,
        randomFirstPlayer: this.randomFirstPlayer,
        requiresVenusTrackCompletion: this.requiresVenusTrackCompletion,
        requiresMoonTrackCompletion: this.requiresMoonTrackCompletion,
        moonStandardProjectVariant: this.moonStandardProjectVariant,
        moonStandardProjectVariant1: this.moonStandardProjectVariant1,
        altVenusBoard: this.altVenusBoard,
        // Not sanitized, so validation can catch negative values.
        escapeVelocity: this.escapeVelocityMode ? {
          thresholdMinutes: this.escapeVelocityThreshold,
          bonusSectionsPerAction: this.escapeVelocityBonusSeconds,
          penaltyPeriodMinutes: this.escapeVelocityPeriod,
          penaltyVPPerPeriod: this.escapeVelocityPenalty,
        } : undefined,
        twoCorpsVariant: this.twoCorpsVariant,
        startingCeos: this.startingCeos,
        startingPreludes: this.startingPreludes,
      };
    },
    validationErrors(): ValidationErrors {
      return validateNewGameConfig(this.newGameConfig, {
        getCardCompatibility: (name) => getCard(name)?.compatibility ?? [],
        getColonyExpansion: (name) => {
          return getColony(name)?.expansion;
        },
        getMilestoneExpansion: (name) => getMilestone(name)?.requirements,
        getAwardExpansion: (name) => getAward(name)?.requirements,
      });
    },
    hasValidationProblems(): boolean {
      return Object.values(this.validationErrors).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
    },
    hasBlockingValidationErrors(): boolean {
      return (Object.keys(validationDetails) as Array<keyof ValidationErrors>).some((key) => {
        const value = this.validationErrors[key];
        return validationDetails[key].blocking && (Array.isArray(value) ? value.length > 0 : Boolean(value));
      });
    },
    typedRefs(): Refs {
      return this.$refs as Refs;
    },
    constants(): typeof constants {
      return constants;
    },
    PLAYER_COLORS(): typeof PLAYER_COLORS {
      return PLAYER_COLORS;
    },
    MODULE_GROUPS(): typeof MODULE_GROUPS {
      return MODULE_GROUPS;
    },
    MODULES_WITH_OPTIONS(): typeof MODULES_WITH_OPTIONS {
      return MODULES_WITH_OPTIONS;
    },
    PRESETS(): typeof PRESETS {
      return PRESETS;
    },
    QUICK_BOARDS(): typeof QUICK_BOARDS {
      return QUICK_BOARDS;
    },
    BOARD_HEXES(): typeof BOARD_HEXES {
      return BOARD_HEXES;
    },
    MANIFEST_STATUS_LABELS(): typeof MANIFEST_STATUS_LABELS {
      return MANIFEST_STATUS_LABELS;
    },
    /** The preset whose expansions are exactly the ones turned on, if any. */
    activePreset(): Preset | undefined {
      return PRESET_KEYS.find((preset) => EXPANSIONS.every((e) => this.expansions[e] === PRESET_EXPANSIONS[preset].includes(e)));
    },
    /** True when the board is one of the board tiles, alone. */
    isQuickBoardChosen(): boolean {
      return QUICK_BOARDS.some((board) => this.isOnlyBoard(board.name));
    },
    regionLabel(): string {
      if (this.boards.length === 1) {
        return translateText(this.boards[0]);
      }
      return `${translateText('Random')} (${this.boards.length})`;
    },
    firstPlayerLabel(): string {
      if (this.randomFirstPlayer) {
        return translateText('Random');
      }
      const index = this.firstIndex - 1;
      return this.players[index]?.name || this.getPlayerNamePlaceholder(index);
    },
    /** The names of the expansions turned on. */
    manifestModules(): Array<string> {
      return MODULE_GROUPS.flatMap((group) => group.modules).filter((m) => this.expansions[m.key]).map((m) => m.name);
    },
    /** Short names of the rules and variants turned on. */
    manifestRules(): Array<string> {
      const multiplayer = this.playersCount > 1;
      const rules: Array<[boolean, string]> = [
        [multiplayer && this.draftVariant, 'Draft'],
        [multiplayer && this.initialDraft, 'Initial draft'],
        [this.solarPhaseOption, 'World Government'],
        [this.showTimers, 'Timers'],
        [this.undoOption, 'Undo'],
        [!multiplayer && this.soloTR, '63 TR'],
        [multiplayer && this.showOtherPlayersVP, 'Real-time VP'],
        [multiplayer && this.fastModeOption, 'Fast mode'],
        [this.escapeVelocityMode, 'Escape Velocity'],
        [this.shuffleMapOption, 'Randomized tiles'],
        [this.expansions.prelude && this.twoCorpsVariant, 'Merger'],
        [this.expansions.turmoil && this.isPoliticalAgendasExtensionEnabled, 'Agendas'],
        [this.expansions.ares && this.aresExtremeVariant, 'Ares Extreme'],
        [this.expansions.venus && this.altVenusBoard, 'Alt. Venus Board'],
        [this.seededGame, 'Predefined game'],
      ];
      return rules.filter(([on]) => on).map(([, name]) => name);
    },
    /** Notes about how the chosen settings interact. */
    manifestHints(): Array<string> {
      const hints: Array<string> = [];
      if (this.hasBlockingValidationErrors) {
        hints.push('Some settings must be fixed before the game can be created.');
      }
      if (this.expansions.venus && this.solarPhaseOption) {
        hints.push('Venus Next is on, so World Government Terraforming is on too. It keeps game length in check.');
      }
      if (this.playersCount === 1) {
        hints.push('Solo game: you play alone against the generation limit.');
      }
      return hints;
    },
    manifestStatus(): ManifestStatus {
      if (this.hasBlockingValidationErrors) {
        return 'blocked';
      }
      return this.hasValidationProblems ? 'warning' : 'ready';
    },
    /** How many of the advanced options differ from their defaults. */
    advancedActiveCount(): number {
      const multiplayer = this.playersCount > 1;
      return [
        Number(this.startingCorporations) !== 2,
        multiplayer && this.showOtherPlayersVP,
        multiplayer && this.fastModeOption,
        this.escapeVelocityMode,
        this.seededGame,
      ].filter(Boolean).length;
    },
    getPlayers(): Array<NewPlayerModel> {
      return this.players.slice(0, this.playersCount);
    },
    isPoliticalAgendasExtensionEnabled(): boolean {
      return this.politicalAgendasExtension !== 'Standard';
    },
    isBeginnerToggleEnabled(): Boolean {
      return !(this.initialDraft || this.expansions.prelude || this.expansions.venus || this.expansions.colonies || this.expansions.turmoil);
    },
  },
  methods: {
    isOnlyBoard(board: BoardName): boolean {
      return this.boards.length === 1 && this.boards[0] === board;
    },
    /** Turns on exactly the expansions in `preset`. */
    async applyPreset(preset: Preset) {
      // Let the "All" checkbox's watcher run first, so it doesn't undo the preset afterwards.
      this.allOfficialExpansions = preset === 'official';
      await nextTick();
      for (const expansion of EXPANSIONS) {
        this.expansions[expansion] = PRESET_EXPANSIONS[preset].includes(expansion);
      }
    },
    restoreLastSettings() {
      if (!this.rememberSettings) {
        return;
      }
      const settings = createGameSettingsStorage.load();
      if (settings === undefined) {
        return;
      }
      try {
        const processor = this.applySettings(settings);
        if (processor.warnings.length > 0) {
          this.showSettingsLoadResult('Restore settings', processor);
        }
      } catch (e) {
        console.warn('Could not restore create game settings:', e);
        vueRoot(this).showAlert('Restore settings', 'Error restoring settings ' + e);
      }
    },
    applySettings(json: JSONObject): JSONProcessor {
      const component: CreateGameModel = this;
      const processor = new JSONProcessor(component);
      this.uploading = true;
      try {
        processor.applyJSON(json);
      } catch (e) {
        this.uploading = false;
        throw e;
      }
      nextTick(() => {
        try {
          if (!component.seededGame) {
            component.seed = Math.random();
          }
          component.solarPhaseOption = Boolean(processor.solarPhaseOption);
        } finally {
          this.uploading = false;
        }
      });
      return processor;
    },
    showSettingsLoadResult(title: string, processor: JSONProcessor) {
      const root = vueRoot(this);
      if (processor.warnings.length > 0) {
        root.showAlert(title, 'Settings loaded with these warnings: \n' + processor.warnings.join('\n'));
      } else {
        root.showAlert(title, 'Settings loaded.');
      }
    },
    resetSettings() {
      createGameSettingsStorage.clear();
      Object.assign(this, defaultCreateGameModel(), {
        preludeToggled: false,
        uploading: false,
      });
    },
    async downloadSettings() {
      const newGameConfig = await this.serializeSettings();

      if (newGameConfig) {
        const a = document.createElement('a');
        const blob = new Blob([JSON.stringify(newGameConfig, undefined, 2)], {'type': 'application/json'});
        a.href = window.URL.createObjectURL(blob);
        a.download = 'tm_settings.json';
        a.click();
      }
    },
    uploadSettings() {
      const refs = this.typedRefs;
      const file = refs.file.files !== null ? refs.file.files[0] : undefined;
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        try {
          const readerResults = reader.result;
          if (typeof(readerResults) === 'string') {
            const processor = this.applySettings(JSON.parse(readerResults));
            this.showSettingsLoadResult('Upload settings', processor);
          }
        } catch (e) {
          const root = vueRoot(this);
          root.showAlert('Upload settings', 'Error loading settings ' + e);
        }
      }, false);
      if (file) {
        if (/\.json$/i.test(file.name)) {
          reader.readAsText(file);
        }
      }
    },
    getPlayerNamePlaceholder(index: number): string {
      return translateTextWithParams('Player ${0} name', [String(index + 1)]);
    },
    updateCustomCorporations(customCorporations: Array<CardName>) {
      this.customCorporations = customCorporations;
    },
    updateCustomPreludes(customPreludes: Array<CardName>) {
      this.customPreludes = customPreludes;
    },
    updateBannedCards(bannedCards: Array<CardName>) {
      this.bannedCards = bannedCards;
    },
    updateIncludedCards(includedCards: Array<CardName>) {
      this.includedCards = includedCards;
    },
    updateCustomColonies(customColonies: Array<ColonyName>) {
      this.customColonies = customColonies;
    },
    updateCustomCeos(customCeos: Array<CardName>) {
      this.customCeos = customCeos;
    },
    politicalAgendasExtensionToggle() {
      if (this.politicalAgendasExtension === 'Standard') {
        this.politicalAgendasExtension = 'Random';
      } else {
        this.politicalAgendasExtension = 'Standard';
      }
    },
    getPoliticalAgendasExtensionAgendaStyle(type: 'random' | 'chairman'): AgendaStyle {
      if (type === 'random') {
        return 'Random';
      } else if (type === 'chairman') {
        return 'Chairman';
      } else {
        console.warn('AgendaStyle not found');
        return 'Standard';
      }
    },
    getPlayersCountText(count: number): string {
      if (count === 1) {
        return translateText('Solo');
      }
      return count.toString();
    },
    deselectVenusCompletion() {
      if (this.expansions.venus === false) {
        this.requiresVenusTrackCompletion = false;
      }
    },
    deselectMoonCompletion() {
      if (this.expansions.moon === false) {
        this.requiresMoonTrackCompletion = false;
        this.moonStandardProjectVariant = false;
        this.moonStandardProjectVariant1 = false;
      }
    },
    getPlayerCubeColorClass(color: Color): string {
      return playerColorClass(color, 'bg');
    },
    getPlayerContainerColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
    async serializeSettings(): Promise<NewGameConfig | undefined> {
      let players = this.players.slice(0, this.playersCount);

      if (this.randomFirstPlayer) {
        // Shuffle players array to assign each player a random seat around the table
        players = players.map((a) => ({sort: Math.random(), value: a}))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.value);
        this.firstIndex = Math.floor(this.seed * this.playersCount) + 1;
      }

      // Auto assign an available color if there are duplicates
      const uniqueColors = new Set(players.map((player) => player.color));
      if (uniqueColors.size !== players.length) {
        const usedColors: Set<Color> = new Set();
        // This filter retains the default player color order.
        const unusedColors = PLAYER_COLORS.filter((c) => !uniqueColors.has(c));
        for (const player of players) {
          const color = player.color;
          if (usedColors.has(color)) {
            // Pulling off the front of the list also helps retain the default player color order.
            player.color = unusedColors.shift() as Color;
            usedColors.add(color);
          } else {
            usedColors.add(color);
          }
        }
      }

      // Set player name automatically if not entered
      const isSoloMode = this.playersCount === 1;

      this.players.forEach((player) => {
        if (player.name === '') {
          if (isSoloMode) {
            player.name = this.$t('You');
          } else {
            const defaultPlayerName = this.$t(player.color.charAt(0).toUpperCase() + player.color.slice(1));
            player.name = defaultPlayerName;
          }
        }
      });

      players.map((player, index) => {
        player.first = (this.firstIndex === index + 1);
        return player;
      });

      let clonedGamedId: undefined | GameId = undefined;

      // Clone game checks
      if (this.clonedGameId !== undefined && this.seededGame) {
        const gameData = await fetch(paths.API_CLONEABLEGAME + '?id=' + this.clonedGameId)
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            if (response.status === 404) {
              return undefined;
            }
            return response.text().then((res) => new Error(res));
          });
        if (gameData === undefined) {
          alert(this.$t('Game id ' + this.clonedGameId + ' not found'));
          return undefined;
        }
        if (gameData instanceof Error) {
          alert(this.$t('Error looking for predefined game ' + gameData.message));
          return undefined;
        }
        clonedGamedId = this.clonedGameId;
        if (gameData.playerCount !== players.length) {
          alert(this.$t('Player count mismatch'));
          this.playersCount = gameData.playerCount;
          return undefined;
        }
      } else if (!this.seededGame) {
        clonedGamedId = undefined;
      }

      const config = this.newGameConfig;
      const isSolo = players.length === 1;
      return {
        ...config,
        // Solo games have no milestones and awards, and the form hides their settings.
        randomMA: isSolo ? RandomMAOptionType.NONE : config.randomMA,
        customMA: isSolo ? undefined : config.customMA,
        players,
        clonedGamedId,
        escapeVelocity: config.escapeVelocity === undefined ? undefined : sanitizeEscapeVelocityOptions(config.escapeVelocity),
      };
    },
    async createGame() {
      if (this.hasBlockingValidationErrors) {
        return;
      }
      const newGameConfig = await this.serializeSettings();

      if (newGameConfig === undefined) {
        return;
      }
      if (this.rememberSettings) {
        createGameSettingsStorage.save(newGameConfig);
      }
      const onSuccess = (json: any) => {
        if (json.players.length === 1) {
          window.location.href = 'player?id=' + json.players[0].id;
          return;
        } else {
          window.history.replaceState(json, `${constants.APP_NAME} - Game`, 'game?id=' + json.id);
          vueRoot(this).game = json;
          vueRoot(this).screen = 'game-home';
        }
      };

      fetch(paths.API_CREATEGAME, {'method': 'POST', 'body': JSON.stringify(newGameConfig), 'headers': {'Content-Type': 'application/json'}})
        .then((response) => response.text())
        .then((text) => {
          try {
            const json = JSON.parse(text);
            onSuccess(json);
          } catch (err) {
            throw new Error(text);
          }
        })
        .catch((error: Error) => {
          alert(error.message);
        });
    },
  },
});

</script>
