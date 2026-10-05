import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company) redirect("/onboarding");

  const [planItems, chatMessages, pendingCount] = await Promise.all([
    prisma.actionPlanItem.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
      include: { proposals: { orderBy: { createdAt: "desc" } } },
    }),
    prisma.chatMessage.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: "asc" },
    }),
    prisma.agentProposal.count({
      where: { companyId: company.id, status: "en_attente" },
    }),
  ]);

  return (
    <AppShell companyName={company.name}>
      <DashboardClient
        company={company}
        initialPlanItems={planItems}
        initialChatMessages={chatMessages}
        pendingCount={pendingCount}
      />
    </AppShell>
  );
}
