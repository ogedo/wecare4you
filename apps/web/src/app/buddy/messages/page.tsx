import { ConversationView } from "@/components/messages/ConversationView";

export default function BuddyMessagesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Messages</h2>
      <ConversationView />
    </div>
  );
}
