import { DashboardNav } from "@/components/dashboard/dashboard-nav";

export default async function DashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Welcome back!</h1>
      </div>

      {/* Navigation Cards */}
      <section>
        <h2 className="font-semibold text-xl mb-4">Get Started</h2>
        <DashboardNav />
      </section>
    </div>
  );
}
