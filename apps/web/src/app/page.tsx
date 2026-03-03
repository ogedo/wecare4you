import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary-600 mb-2">WeCare4You</h1>
        <p className="text-neutral-600 text-lg">
          Talk to someone who understands
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/admin/dashboard"
          className="px-6 py-3 bg-primary-500 text-white rounded-xl font-semibold hover:bg-primary-600 transition-colors text-center"
        >
          Admin Portal
        </Link>
        <Link
          href="/therapist/dashboard"
          className="px-6 py-3 bg-primary-100 text-primary-700 rounded-xl font-semibold hover:bg-primary-200 transition-colors text-center"
        >
          Provider Portal
        </Link>
      </div>
    </main>
  );
}
