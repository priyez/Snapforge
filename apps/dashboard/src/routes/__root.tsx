import { Outlet, createRootRoute } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      {/* TanStack Router Devtools could go here */}
    </>
  ),
});
