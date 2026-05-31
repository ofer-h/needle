import { NotificationSettings, type NotificationConfig } from '@needle/ui-web';
import './screens.css';

type NotificationsScreenProps = {
  config: NotificationConfig;
  setConfig: (next: NotificationConfig) => void;
};

export function NotificationsScreen({ config, setConfig }: NotificationsScreenProps) {
  return (
    <div className="screen">
      <h1 className="screen__title">Notifications</h1>
      <p className="screen__lede">
        How far ahead of a hard stop to nudge you, when to stay quiet, and which alert
        treatments rotate so they never become wallpaper.
      </p>
      <NotificationSettings config={config} onChange={setConfig} />
    </div>
  );
}
