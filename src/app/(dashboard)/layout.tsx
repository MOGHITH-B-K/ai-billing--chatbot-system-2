import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { PlanBadge } from "@/components/plan-badge";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b bg-background px-4 py-2">
          <SidebarTrigger />
          <PlanBadge />
        </div>
        <div className="p-6">{children}</div>
      </main>
    </SidebarProvider>
  );
}