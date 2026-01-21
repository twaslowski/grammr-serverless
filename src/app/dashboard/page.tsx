import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { StudyDueCards } from "@/components/study";

export default async function DashboardPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl">
      <div className="flex flex-col gap-2">
        <h1 className="font-bold text-3xl">Welcome back!</h1>
      </div>

      {/* Study Due Cards */}
      <section>
        <StudyDueCards />
      </section>

      {/* Navigation Cards */}
      <section>
        <DashboardNav />
      </section>
    </div>
  );
}
