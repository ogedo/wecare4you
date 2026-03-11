"use client";

import { ConversationView } from "@/components/messages/ConversationView";

export default function PatientMessagesPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-6">Messages</h2>
      <ConversationView />
    </div>
  );
}
