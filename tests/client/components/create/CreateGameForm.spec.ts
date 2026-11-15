import {flushPromises, mount, shallowMount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {expect} from 'chai';
import CreateGameForm from '@/client/components/create/CreateGameForm.vue';
import {createGameSettingsStorage} from '@/client/components/create/createGameSettingsStorage';
import {useFakeLocalStorage} from '../FakeLocalStorage';
import {BoardName} from '@/common/boards/BoardName';
import {DEFAULT_EXPANSIONS} from '@/common/cards/GameModule';
import {JSONObject} from '@/common/Types';
import {defineComponent} from 'vue';
import {NewGameConfig, NewPlayerModel} from '@/common/game/NewGameConfig';
import {CardName} from '@/common/cards/CardName';
import {CreateGameModel} from '@/client/components/create/CreateGameModel';
import {ValidationErrors} from '@/common/game/validateNewGameConfig';
import {ColonyName} from '@/common/colonies/ColonyName';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {PreferencesManager} from '@/client/utils/PreferencesManager';

// Minimal serialized Create Game payload used by settings restore tests.
function createNewGameConfig(overrides: JSONObject = {}):  NewGameConfig {
  // Not ideal but is fine for the tests.
  const config: Partial<NewGameConfig> = {
    players: [
      {name: 'Alice', color: 'red', beginner: false, handicap: 0, first: false},
      {name: 'Bob', color: 'blue', beginner: false, handicap: 0, first: true},
    ],
    expansions: DEFAULT_EXPANSIONS,
    boards: [BoardName.HELLAS],
    draftVariant: false,
    solarPhaseOption: true,
    ...overrides,
  };
  return config as NewGameConfig;
}

/*
 * Returns `count` distinct card names of any type.
 *
 * Suitable only for checks that count a list's cards.
 */
function cardNames(count: number): Array<CardName> {
  return Object.values(CardName).slice(0, count);
}

/*
 * Returns the validation errors for a two-player game after `setup` adjusts the form.
 */
function validateTwoPlayerGame(setup: (model: CreateGameModel) => void): ValidationErrors {
  const wrapper = shallowMount(CreateGameForm, {
    ...globalConfig,
  });
  const model = wrapper.vm as unknown as CreateGameModel;
  model.playersCount = 2;
  setup(model);
  return wrapper.vm.validationErrors;
}

describe('CreateGameForm', () => {
  useFakeLocalStorage();
  beforeEach(() => {
    PreferencesManager.resetForTest();
  });

  it('mounts without errors', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('sends the selected player as first player', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });

    wrapper.vm.playersCount = 3;
    wrapper.vm.randomFirstPlayer = false;
    wrapper.vm.firstIndex = 2;

    const config = await wrapper.vm.serializeSettings();

    expect(config?.players.map((player: NewPlayerModel) => player.first)).deep.eq([false, true, false]);
  });

  it('restores the last saved game settings on load', async () => {
    PreferencesManager.INSTANCE.set('remember_create_game_settings', true);
    createGameSettingsStorage.save(createNewGameConfig({
      expansions: {...DEFAULT_EXPANSIONS, venus: true},
    }));

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.playersCount).eq(2);
    expect(wrapper.vm.players[0].name).eq('Alice');
    expect(wrapper.vm.players[1].name).eq('Bob');
    expect(wrapper.vm.boards).deep.eq([BoardName.HELLAS]);
    expect(wrapper.vm.draftVariant).eq(false);
    expect(wrapper.vm.expansions.venus).eq(true);
    expect(wrapper.vm.solarPhaseOption).eq(true);
  });

  it('shows warnings when restoring saved settings', async () => {
    PreferencesManager.INSTANCE.set('remember_create_game_settings', true);
    const alerts: Array<{title: string, message: string}> = [];
    const Root = defineComponent({
      components: {
        CreateGameForm,
      },
      template: '<CreateGameForm ref="form" />',
    });
    const wrapper = mount(Root, {
      ...globalConfig,
    });
    const form = wrapper.findComponent(CreateGameForm);
    (form.vm.$root as any).showAlert = (title: string, message: string) => {
      alerts.push({title, message});
    };

    createGameSettingsStorage.save(createNewGameConfig({
      customPreludes: ['Bad Prelude Name'],
    }));

    form.vm.restoreLastSettings();
    await form.vm.$nextTick();

    expect(alerts).deep.eq([{
      title: 'Restore settings',
      message: "Settings loaded with these warnings: \nUnknown card name 'Bad Prelude Name' in customPreludes",
    }]);
  });

  it('resets the form and clears saved settings', async () => {
    PreferencesManager.INSTANCE.set('remember_create_game_settings', true);
    createGameSettingsStorage.save(createNewGameConfig());

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.boards).deep.eq([BoardName.HELLAS]);

    wrapper.vm.resetSettings();
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.boards).deep.eq([BoardName.THARSIS]);
    expect(wrapper.vm.draftVariant).eq(true);
    expect(createGameSettingsStorage.load()).eq(undefined);
    expect(wrapper.findAllComponents({name: 'AppButton'}).map((button) => button.props('title'))).includes('Reset');
  });

  it('clears uploading when applying settings throws', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });

    expect(() => (wrapper.vm as any).applySettings(createNewGameConfig({
      players: [
        {name: 'Alice', color: 'red', beginner: false, handicap: 0},
        {name: 'Bob', color: 'red', beginner: false, handicap: 0},
      ],
    }))).throws('Colors are duplicated');
    expect(wrapper.vm.uploading).eq(false);
  });

  it('saves current settings before creating a game', async () => {
    PreferencesManager.INSTANCE.set('remember_create_game_settings', true);
    const originalFetch = global.fetch;
    const originalAlert = global.alert;
    global.fetch = (() => Promise.reject(new Error('stop after saving'))) as typeof fetch;
    global.alert = (() => {}) as typeof alert;

    try {
      const wrapper = shallowMount(CreateGameForm, {
        ...globalConfig,
      });
      wrapper.vm.playersCount = 2;
      wrapper.vm.randomFirstPlayer = false;
      wrapper.vm.players[0].name = 'Alice';
      wrapper.vm.players[1].name = 'Bob';
      wrapper.vm.boards = [BoardName.ELYSIUM];

      await wrapper.vm.createGame();

      const savedSettings = createGameSettingsStorage.load();
      expect(savedSettings?.boards).deep.eq([BoardName.ELYSIUM]);
      expect((savedSettings?.players as Array<{name: string}>).map((player) => player.name)).deep.eq(['Alice', 'Bob']);
    } finally {
      global.fetch = originalFetch;
      global.alert = originalAlert;
    }
  });
  it('does not restore saved settings when remember is off', async () => {
    createGameSettingsStorage.save(createNewGameConfig());

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect(wrapper.vm.boards).deep.eq([BoardName.THARSIS]);
  });

  it('solo games ignore the milestone and award settings', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const model = wrapper.vm as unknown as CreateGameModel;
    model.playersCount = 1;
    model.goals = {...model.goals, type: 'manual', selected: {milestones: ['Terraformer'], awards: []}};
    expect(wrapper.vm.hasBlockingValidationErrors).is.false;
    const config: NewGameConfig | undefined = await wrapper.vm.serializeSettings();
    expect(config?.randomMA).eq(RandomMAOptionType.NONE);
    expect(config?.customMA).is.undefined;
  });

  it('validates the form settings', () => {
    expect(validateTwoPlayerGame((model) => model.customCorporations = cardNames(3)).notEnoughCorporations).eq(4);
    expect(validateTwoPlayerGame((model) => model.customCorporations = cardNames(4)).notEnoughCorporations).eq(0);
  });

  it('ignores unknown colony names when validating', () => {
    const errors = validateTwoPlayerGame((model) => model.customColonies = ['Unknown Colony' as ColonyName]);
    expect(errors.coloniesMissingExpansions).deep.eq([]);
  });

  it('validates hand-picked milestones and awards against the expansions', () => {
    const errors = validateTwoPlayerGame((model) => {
      model.expansions.turmoil = false;
      model.goals = {...model.goals, type: 'manual', selected: {milestones: ['Terraformer'], awards: ['Banker', 'Politician']}};
    });
    expect(errors.milestonesMissingExpansions).is.false;
    expect(errors.awardsMissingExpansions).is.true;
  });

  it('disables Create game when there is a blocking error', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const createGameButton = () => wrapper.findAllComponents({name: 'AppButton'}).find((button) => button.props('title') === 'Create game');
    expect(createGameButton()?.props('disabled')).is.false;
    expect(wrapper.find('.create-game-custom-preludes-warning').exists()).is.false;

    wrapper.vm.playersCount = 2;
    wrapper.vm.customCorporations = cardNames(3);
    await wrapper.vm.$nextTick();

    expect(createGameButton()?.props('disabled')).is.true;
    expect(wrapper.find('.create-game-custom-preludes-warning').exists()).is.true;
  });

  it('replaces a cleared escape velocity field with its default', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const model = wrapper.vm as unknown as CreateGameModel;
    model.playersCount = 2;
    model.escapeVelocityMode = true;
    model.escapeVelocityThreshold = 35;
    // A cleared number input binds as an empty string.
    model.escapeVelocityPeriod = '' as unknown as number;
    const config: NewGameConfig | undefined = await wrapper.vm.serializeSettings();
    expect(config?.escapeVelocity).deep.eq({
      thresholdMinutes: 35,
      bonusSectionsPerAction: 2,
      penaltyPeriodMinutes: 2,
      penaltyVPPerPeriod: 1,
    });
  });

  it('applies expansion presets', async () => {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    await wrapper.get('[data-test="preset-recommended"]').trigger('click');
    await flushPromises();
    expect(wrapper.vm.expansions).deep.eq({...DEFAULT_EXPANSIONS, prelude: true, venus: true, promo: true});
    expect(wrapper.vm.activePreset).eq('recommended');
    expect(wrapper.get('[data-test="preset-recommended"]').classes()).contains('tm-chip-button--on');

    await wrapper.get('[data-test="preset-official"]').trigger('click');
    await flushPromises();
    expect(wrapper.vm.expansions).deep.eq({...DEFAULT_EXPANSIONS, prelude: true, prelude2: true, venus: true, colonies: true, turmoil: true, promo: true});

    await wrapper.get('[data-test="preset-base"]').trigger('click');
    await flushPromises();
    expect(wrapper.vm.expansions).deep.eq(DEFAULT_EXPANSIONS);
  });

  it('picks a board from the board tiles', async () => {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    await wrapper.get('#quickBoard-2').trigger('change');
    expect(wrapper.vm.boards).deep.eq([BoardName.ELYSIUM]);
    expect(wrapper.vm.isQuickBoardChosen).is.true;
    wrapper.vm.boards = [BoardName.ARABIA_TERRA];
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.isQuickBoardChosen).is.false;
    expect(wrapper.find('.tm-board-tile--more.tm-board-tile--on').exists()).is.true;
  });

  it('shows expansion options only while the expansion is on', async () => {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    expect(wrapper.find('#aresExtremeVariantVariant-checkbox').exists()).is.false;
    await wrapper.get('#ares-checkbox').setValue(true);
    expect(wrapper.find('[data-module="ares"] #aresExtremeVariantVariant-checkbox').exists()).is.true;
  });

  it('summarizes the settings in the manifest', async () => {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    wrapper.vm.playersCount = 2;
    wrapper.vm.expansions.venus = true;
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.manifestModules).deep.eq(['Corporate Era', 'Venus Next']);
    expect(wrapper.vm.manifestRules).includes('World Government');
    expect(wrapper.findAll('[data-test="manifest-hint"]').map((hint) => hint.text()).join()).contains('Venus Next is on');
    expect(wrapper.find('.tm-manifest .tm-create-submit').exists()).is.true;
  });
});
