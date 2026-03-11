import { CounselorSidebar } from "@/components/counselor/CounselorSidebar";

export default function CounselorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <CounselorSidebar />
      <main className="flex-1 p-8 bg-neutral-50 overflow-auto">{children}</main>
    </div>
  );
}
