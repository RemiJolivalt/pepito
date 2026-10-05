import Link from "next/link";

export function AppHeader({ companyName }: { companyName?: string }) {
  return (
    <header className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl items-center justify-between p-4">
        <Link href="/dashboard" className="font-semibold">
          Pepito{companyName ? ` — ${companyName}` : ""}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-gray-600">
          <Link href="/dashboard" className="hover:text-black">
            Dashboard
          </Link>
          <Link href="/connexions" className="hover:text-black">
            Connexions
          </Link>
          <Link href="/rapport" className="hover:text-black">
            Rapport
          </Link>
          <Link href="/onboarding" className="hover:text-black">
            Mon profil
          </Link>
          <form action="/api/auth/logout" method="post">
            <button type="submit" className="hover:text-black">
              Déconnexion
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
