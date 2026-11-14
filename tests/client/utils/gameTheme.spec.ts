import {expect} from 'chai';
import {cubeShades, phaseStep, playerHex, terraformedPercent} from '@/client/utils/gameTheme';
import {BoardName} from '@/common/boards/BoardName';
import {Phase} from '@/common/Phase';

describe('gameTheme', () => {
  it('maps every phase to a step in the header strip', () => {
    expect(phaseStep(Phase.RESEARCH)).eq('research');
    expect(phaseStep(Phase.DRAFTING)).eq('research');
    expect(phaseStep(Phase.PRELUDES)).eq('action');
    expect(phaseStep(Phase.ACTION)).eq('action');
    expect(phaseStep(Phase.PRODUCTION)).eq('production');
    expect(phaseStep(Phase.SOLAR)).eq('production');
    expect(phaseStep(Phase.END)).is.undefined;
  });

  it('measures terraforming progress', () => {
    expect(terraformedPercent({temperature: -30, oxygenLevel: 0, oceans: 0}, BoardName.THARSIS)).eq(0);
    expect(terraformedPercent({temperature: 8, oxygenLevel: 14, oceans: 9}, BoardName.THARSIS)).eq(100);
    // 4 of 19 temperature steps, 7 of 14 oxygen, 3 of 9 oceans: 14 of 42 steps.
    expect(terraformedPercent({temperature: -22, oxygenLevel: 7, oceans: 3}, BoardName.THARSIS)).eq(33);
  });

  it('shades player cubes lighter on top and darker on the right', () => {
    const shades = cubeShades('blue');
    expect(shades.left).eq(playerHex('blue'));
    expect(shades.top).not.eq(shades.left);
    expect(shades.right).not.eq(shades.left);
  });
});
