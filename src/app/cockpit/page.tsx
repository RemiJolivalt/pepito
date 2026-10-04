import { prisma } from "@/lib/prisma";
import { CockpitClient } from "./cockpit-client";

export const dynamic = "force-dynamic";

export default async function CockpitPage() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
  });

  return <CockpitClient initialCompanies={companies} />;
}
