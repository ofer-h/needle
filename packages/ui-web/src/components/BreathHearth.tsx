import { type CSSProperties } from 'react';
import './BreathHearth.css';

export type BreathHearthProps = {
  /** Optional cue text shown below the circle. Defaults to 'Inhale… Exhale…' */
  label?: string;
  /** Full inhale-hold-exhale cycle in seconds. Default 5. */
  cycleSeconds?: number;
  /** Diameter of the outer ring in px. Default 160. */
  size?: number;
};

export function BreathHearth({ label, cycleSeconds = 5, size = 160 }: BreathHearthProps) {
  const innerSize = Math.round(size * 0.7);

  const outerStyle: CSSProperties = {
    width: size,
    height: size,
    ['--bh-cycle' as string]: `${cycleSeconds}s`,
  };

  const innerStyle: CSSProperties = {
    width: innerSize,
    height: innerSize,
  };

  const cueText = label !== undefined ? label : 'Inhale… Exhale…';

  return (
    <div className="bh" role="img" aria-label="Breathing guide circle">
      <div className="bh__outer" style={outerStyle}>
        <div className="bh__inner" style={innerStyle} />
      </div>
      {cueText && <span className="bh__cue">{cueText}</span>}
    </div>
  );
}
