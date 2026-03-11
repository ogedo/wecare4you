"use client";

import { Clock } from "lucide-react";

export default function CounselorSessionsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-1">Session History</h2>
      <p className="text-neutral-500 mb-8">A record of all crisis sessions you have handled</p>

      <div className="bg-white rounded-2xl border border-neutral-200 p-12 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="h-16 w-16 bg-primary-50 rounded-2xl flex items-center justify-center mb-4">
          <Clock className="h-8 w-8 text-primary-400" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-800 mb-2">
          Session history will appear here
        </h3>
        <p className="text-sm text-neutral-500 leading-relaxed">
          Sessions you have completed will be listed here with details on duration, patient
          outcome notes, and timestamps. This feature is coming soon.
        </p>
      </div>
    </div>
  );
}
