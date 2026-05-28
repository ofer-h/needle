type Props = {
  title?: string | undefined;
};

export default function Titlebar({ title }: Props) {
  return (
    <div className="titlebar">
      {/* Native macOS traffic lights are rendered by Electron (titleBarStyle: hiddenInset).
          No HTML lights here — that would double them up. */}
      {title && <div className="title-center">{title}</div>}
    </div>
  );
}
