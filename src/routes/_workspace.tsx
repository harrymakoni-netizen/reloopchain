import { Outlet, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/reloop/shell";

export const Route = createFileRoute("/_workspace")({
  component: WorkspaceLayout,
});

function WorkspaceLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
