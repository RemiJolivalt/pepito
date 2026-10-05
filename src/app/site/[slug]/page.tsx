import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Page publique du site d'une TPE, hébergée par Pepito. Le HTML est généré
 * par un modèle puis nettoyé (publish.ts) ; il est en plus servi dans une
 * iframe `sandbox` sans aucun droit (ni script, ni formulaire, ni same-origin)
 * — défense en profondeur contre tout contenu actif.
 */
export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const company = await prisma.company.findUnique({
    where: { siteSlug: slug },
    select: { name: true, siteHtml: true },
  });
  if (!company?.siteHtml) notFound();

  return (
    <iframe
      title={company.name}
      sandbox=""
      srcDoc={company.siteHtml}
      style={{ border: 0, width: "100vw", height: "100vh", display: "block" }}
    />
  );
}
