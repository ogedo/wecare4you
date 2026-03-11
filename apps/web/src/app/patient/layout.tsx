import { PatientSidebar } from "@/components/patient/PatientSidebar";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <PatientSidebar />
      <main className="flex-1 p-8 bg-neutral-50 overflow-auto">{children}</main>
    </div>
  );
}
