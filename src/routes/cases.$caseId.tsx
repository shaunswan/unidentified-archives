import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/cases/$caseId")({
  component: CaseRouteLayout,
});

function CaseRouteLayout() {
  return <Outlet />;
}
