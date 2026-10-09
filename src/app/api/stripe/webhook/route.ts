// Webhook Stripe : active ou coupe l'offre Pro automatiquement.
// Variables d'environnement requises (Vercel) : STRIPE_WEBHOOK_SECRET, SUPABASE_SERVICE_ROLE_KEY.
// Événements à cocher dans Stripe : checkout.session.completed, customer.subscription.updated, customer.subscription.deleted.
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function verifier(corps: string, entete: string | null, secret: string): boolean {
  if (!entete) return false;
  const parts = Object.fromEntries(
    entete.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i), p.slice(i + 1)];
    }),
  ) as Record<string, string>;
  const t = Number(parts.t);
  if (!t || Math.abs(Date.now() / 1000 - t) > 300) return false;
  const attendu = createHmac("sha256", secret).update(`${t}.${corps}`).digest("hex");
  const signatures = entete
    .split(",")
    .filter((p) => p.startsWith("v1="))
    .map((p) => p.slice(3));
  return signatures.some((s) => s.length === attendu.length && timingSafeEqual(Buffer.from(s), Buffer.from(attendu)));
}

function finPeriode(obj: Record<string, unknown>): string | null {
  const items = obj.items as { data?: { current_period_end?: number }[] } | undefined;
  const ts = (obj.current_period_end as number | undefined) ?? items?.data?.[0]?.current_period_end;
  return ts ? new Date(ts * 1000).toISOString() : null;
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !cle) return new Response("Webhook non configuré", { status: 503 });

  const corps = await req.text();
  if (!verifier(corps, req.headers.get("stripe-signature"), secret)) return new Response("Signature invalide", { status: 400 });

  const evt = JSON.parse(corps) as { type: string; data: { object: Record<string, unknown> } };
  const obj = evt.data.object;
  const sb = createClient(SUPABASE_URL, cle, { auth: { persistSession: false } });

  if (evt.type === "checkout.session.completed") {
    let userId = (obj.client_reference_id as string | null) ?? null;
    const email = ((obj.customer_details as { email?: string } | null)?.email ?? (obj.customer_email as string | null)) || null;
    if (!userId && email) {
      const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      userId = data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    }
    if (!userId) {
      await sb.from("leads").insert({
        type: "pro",
        email: email ?? "inconnu@paiement.stripe",
        message: `Paiement Stripe reçu sans compte Rentimo associé (session ${obj.id}). Créer le compte puis activer l'offre.`,
        source: "stripe",
      });
      return Response.json({ recu: true, associe: false });
    }
    await sb.from("subscriptions").upsert({
      user_id: userId,
      plan: "pro",
      status: "active",
      stripe_customer_id: (obj.customer as string) ?? null,
      stripe_subscription_id: (obj.subscription as string) ?? null,
      current_period_end: null,
      updated_at: new Date().toISOString(),
    });
    await sb.from("achats").upsert(
      { user_id: userId, produit: "pro", montant_cents: (obj.amount_total as number) ?? null, stripe_session_id: obj.id as string },
      { onConflict: "stripe_session_id" },
    );
    return Response.json({ recu: true, associe: true });
  }

  if (evt.type === "customer.subscription.updated" || evt.type === "customer.subscription.deleted") {
    const statutStripe = obj.status as string;
    const actif = evt.type !== "customer.subscription.deleted" && ["active", "trialing", "past_due"].includes(statutStripe);
    const maj = {
      plan: actif ? "pro" : "free",
      status: actif ? "active" : "canceled",
      current_period_end: actif ? finPeriode(obj) : null,
      updated_at: new Date().toISOString(),
    };
    const { data } = await sb.from("subscriptions").update(maj).eq("stripe_subscription_id", obj.id as string).select("user_id");
    if (!data?.length && obj.customer) {
      await sb.from("subscriptions").update(maj).eq("stripe_customer_id", obj.customer as string);
    }
    return Response.json({ recu: true });
  }

  return Response.json({ recu: true, ignore: evt.type });
}
