import { ChatDock } from '@needle/ui-web';
import './screens.css';

type ChatScreenProps = {
  onSend: (text: string) => { reply: string; revisionId?: string };
  onUndo: (revisionId: string) => void;
};

export function ChatScreen({ onSend, onUndo }: ChatScreenProps) {
  return (
    <div className="screen screen--chat">
      <h1 className="screen__title">Chat</h1>
      <p className="screen__lede">
        Write to the AI to add, remember, or change things. Every action it takes is
        attributed and revertible — see them all on the Revisions screen.
      </p>
      <ChatDock onSend={onSend} onUndo={onUndo} />
    </div>
  );
}
