import { ProviderSidebar } from "@/components/provider/ProviderSidebar";

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <ProviderSidebar role="therapist" />
      <main className="flex-1 p-8 bg-neutral-50 overflow-auto">{children}</main>
    </div>
  );
}
