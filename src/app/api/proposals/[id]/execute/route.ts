import { NextRequest, NextResponse } from "next/server";
import { publishSiteFromProposal } from "@/lib/site/publish";

/**
 * Exécution réelle d'une proposition VALIDÉE. Aujourd'hui une seule
 * exécution existe : publier le site d'une page. Les autres types
 * (fiche Google, posts) attendent les connexions OAuth — cf. docs/backlog.md.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const { slug } = await publishSiteFromProposal(id);
    return NextResponse.json({ url: `/site/${slug}` });
  } catch (error) {
    console.error("Erreur exécution proposition:", error);
    const message = error instanceof Error ? error.message : "Échec de l'exécution";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
