"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/dashboard", label: "Aujourd'hui", hint: "Le plan de Paul et vos validations" },
  { href: "/equipe", label: "Équipe", hint: "Les agents, un par un" },
  { href: "/prospection", label: "Prospection", hint: "Prospects, contacts, RDV, clients" },
  { href: "/rapport", label: "Rapport", hint: "Ce qui a été fait" },
  { href: "/connexions", label: "Connexions", hint: "Google, Facebook, Instagram" },
  { href: "/onboarding", label: "Mon entreprise", hint: "Objectif, zone, site" },
  { href: "/admin", label: "Administration", hint: "Coûts, entreprises, usage" },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {ITEMS.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <span className="block font-medium">{item.label}</span>
            <span className={`block text-xs ${active ? "text-indigo-100" : "text-slate-400"}`}>
              {item.hint}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
