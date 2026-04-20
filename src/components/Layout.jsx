import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";

export default function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="relative flex min-h-screen flex-1 flex-col overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(37,99,235,0.10),_transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.98),rgba(248,250,252,1))]" />
        <MobileNav />
        <main className="relative flex-1 overflow-y-auto px-4 pb-8 pt-4 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}