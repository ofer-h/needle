import { SettingsPanel, type NotificationConfig, type TransitionSettings } from '@needle/ui-web';
import './screens.css';

type SettingsScreenProps = {
  transition: TransitionSettings;
  onTransitionChange: (next: TransitionSettings) => void;
  notifications: NotificationConfig;
  onNotificationsChange: (next: NotificationConfig) => void;
};

export function SettingsScreen({
  transition,
  onTransitionChange,
  notifications,
  onNotificationsChange,
}: SettingsScreenProps) {
  return (
    <div className="screen">
      <h1 className="screen__title">Settings</h1>
      <p className="screen__lede">
        Configure your transition ritual blocks and notification behaviour. Changes apply
        immediately — the Transition screen picks them up.
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
