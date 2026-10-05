import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { EquipeClient } from "./equipe-client";

export const dynamic = "force-dynamic";

export default async function EquipePage() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company) redirect("/onboarding");

  const [auditFindings, proposals] = await Promise.all([
    prisma.auditFinding.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" } }),
    prisma.agentProposal.findMany({ where: { companyId: company.id }, orderBy: { createdAt: "desc" } }),
  ]);

  return (
    <AppShell companyName={company.name}>
      <EquipeClient company={company} initialAuditFindings={auditFindings} initialProposals={proposals} />
    </AppShell>
  );
}
