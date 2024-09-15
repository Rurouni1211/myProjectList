import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <>
      <Outlet /> {/* This renders the current route's component */}
    </>
  );
}