import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionEmail } from "@/lib/session";
import { AppShell } from "@/components/app-shell";
import { isOutreachSendingConfigured } from "@/lib/outreach";
import { ProspectionClient } from "./prospection-client";

export const dynamic = "force-dynamic";

export default async function ProspectionPage() {
  const ownerEmail = await getSessionEmail();
  if (!ownerEmail) redirect("/login");

  const company = await prisma.company.findUnique({ where: { ownerEmail } });
  if (!company || !company.name) redirect("/onboarding");

  const leads = await prisma.lead.findMany({
    where: { companyId: company.id, stage: { notIn: ["propose", "ecarte"] } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <AppShell companyName={company.name}>
      <ProspectionClient
        initialLeads={leads}
        initialAutoOutreach={company.autoOutreachEnabled}
        sendingConfigured={isOutreachSendingConfigured()}
      />
    </AppShell>
  );
}
