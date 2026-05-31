import {
  SettingsPanel,
  type NotificationConfig,
  type TransitionSettings,
} from '@needle/ui-web';
import './SettingsScreen.css';

type SettingsScreenProps = {
  transition: TransitionSettings;
  onTransitionChange: (next: TransitionSettings) => void;
  notifications: NotificationConfig;
  onNotificationsChange: (next: NotificationConfig) => void;
  onBack: () => void;
};

/** Desktop Settings screen — mounts the ui-web SettingsPanel bound to App's
 * lifted, persisted state. */
export default function SettingsScreen({
  transition,
  onTransitionChange,
  notifications,
  onNotificationsChange,
  onBack,
}: SettingsScreenProps) {
  return (
    <div className="settings-screen">
      <header className="settings-screen__header">
        <button type="button" className="settings-screen__back" onClick={onBack}>
          ‹ Back
        </button>
        <h1 className="settings-screen__title">Settings</h1>
      </header>
      <p className="settings-screen__lede">
        Configure your transition ritual blocks and notification behaviour. Changes apply
        immediately — the transition overlay picks them up.
      </p>
      <SettingsPanel
        transition={transition}
        onTransitionChange={onTransitionChange}
        notifications={notifications}
        onNotificationsChange={onNotificationsChange}
      />
    </div>
  );
}
