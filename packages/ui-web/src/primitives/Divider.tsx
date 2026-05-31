import './Divider.css';

type DividerProps = {
  label?: string;
  className?: string;
};

/** Hairline rule, optionally with a centered label. */
export function Divider({ label, className }: DividerProps) {
  if (label) {
    return (
      <div className={`ds-divider ds-divider--labeled${className ? ` ${className}` : ''}`}>
        <span className="ds-divider__label">{label}</span>
      </div>
    );
  }
  return <hr className={`ds-divider${className ? ` ${className}` : ''}`} />;
}
