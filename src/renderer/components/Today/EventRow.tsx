import ItemRow from './ItemRow';

type Props = {
  startTime: string;
  label: string;
  sublabel?: string;
};

export default function EventRow({ startTime, label, sublabel }: Props) {
  return (
    <ItemRow
      kind="event"
      label={label}
      startTime={startTime}
      {...(sublabel !== undefined ? { sublabel } : {})}
    />
  );
}
