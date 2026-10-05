import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppHeader } from "@/components/app-header";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company) redirect("/onboarding");

  const [auditFindings, proposals, chatMessages, planItems] = await Promise.all([
    prisma.auditFinding.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.agentProposal.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.chatMessage.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.actionPlanItem.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <AppHeader companyName={company.name} />
      <DashboardClient
        company={company}
        initialAuditFindings={auditFindings}
        initialProposals={proposals}
        initialChatMessages={chatMessages}
        initialPlanItems={planItems}
      />
    </>
  );
}
