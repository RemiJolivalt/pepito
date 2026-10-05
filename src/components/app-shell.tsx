import Link from "next/link";
import { SidebarNav } from "@/components/sidebar-nav";

/** Coque commune des pages connectées : barre latérale (parcours lisible) + contenu. */
export function AppShell({
  companyName,
  children,
}: {
  companyName?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <Link href="/dashboard" className="mb-6 block px-3">
          <span className="text-lg font-semibold tracking-tight">Pepito</span>
          {companyName && (
            <span className="block truncate text-xs text-slate-500">{companyName}</span>
          )}
        </Link>
        <SidebarNav />
        <form action="/api/auth/logout" method="post" className="mt-auto px-3 pt-6">
          <button type="submit" className="text-xs text-slate-400 hover:text-slate-700">
            Déconnexion
          </button>
        </form>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
          <Link href="/dashboard" className="font-semibold">Pepito</Link>
          <Link href="/equipe" className="text-sm text-slate-600">Menu</Link>
        </header>
        <main className="mx-auto max-w-6xl p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
