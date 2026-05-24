type Props = {
  title?: string | undefined;
};

export default function Titlebar({ title }: Props) {
  return (
    <div className="titlebar">
      <div className="lights">
        <span className="l r" />
        <span className="l y" />
        <span className="l g" />
      </div>
      {title && <div className="title-center">{title}</div>}
    </div>
  );
}
