import { createSupabaseAdmin } from "@/lib/supabase-admin";

const PRO_PRODUCT_ID = process.env.POLAR_PRO_PRODUCT_ID!;
const ULTRA_PRODUCT_ID = process.env.POLAR_ULTRA_PRODUCT_ID!;
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN!;

const CREDITS_PRO = 100;
const CREDITS_ULTRA = 300;
const CREDITS_UPGRADE_DELTA = 200; // pro -> ultra

type Plan = "free" | "pro" | "ultra";

function productIdToPlan(productId: string): Plan {
    if (productId === ULTRA_PRODUCT_ID) return "ultra";
    if (productId === PRO_PRODUCT_ID) return "pro";
    return "free";
}

/** order.paid 웹훅 payload.data - Polar는 snake_case, SDK 파싱 후 camelCase일 수 있음 */
interface OrderPaidData {
    id: string;
    customerId?: string;
    customer_id?: string;
    totalAmount?: number;
    total_amount?: number;
    productId?: string | null;
    product_id?: string | null;
    items?: Array<{ productId?: string; product_id?: string }>;
    customer?: { externalId?: string | null; external_id?: string | null };
    billingReason?: string;
}

/**
 * Polar 고객 ID로 external_id(우리 user_id) 조회
 */
async function getCustomerExternalId(customerId: string): Promise<string | null> {
    if (!POLAR_ACCESS_TOKEN) return null;
    const res = await fetch(`https://api.polar.sh/v1/customers/${customerId}`, {
        headers: {
            Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
            Accept: "application/json",
        },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { external_id?: string | null };
    return data.external_id ?? null;
}

/**
 * order.paid: 결제 기록 + 크레딧 충전 (첫결제/갱신 100|300, 업그레이드 시 +200)
 */
function pickOrderFields(order: OrderPaidData) {
    const customerId = order.customerId ?? order.customer_id ?? "";
    const userId =
        (order.customer as { externalId?: string; external_id?: string } | undefined)?.externalId ??
        (order.customer as { externalId?: string; external_id?: string } | undefined)?.external_id ??
        null;
    const productId =
        order.productId ??
        order.product_id ??
        order.items?.[0]?.productId ??
        order.items?.[0]?.product_id ??
        null;
    const totalAmount = order.totalAmount ?? order.total_amount ?? 0;
    return { customerId, userId, productId, totalAmount };
}

export async function handleOrderPaid(order: OrderPaidData): Promise<void> {
    const supabase = createSupabaseAdmin();
    const { customerId, userId: initialUserId, productId: rawProductId, totalAmount: amountCents } = pickOrderFields(order);

    let userId: string | null = initialUserId;
    if (!userId && customerId) {
        userId = await getCustomerExternalId(customerId);
    }
    if (!userId) {
        console.warn("[Polar webhook] order.paid: could not resolve user id for customer", customerId);
        return;
    }

    const productId = rawProductId;
    if (!productId) {
        console.warn("[Polar webhook] order.paid: no product_id in order", order.id);
        return;
    }

    const plan = productIdToPlan(productId);
    if (plan === "free") {
        console.warn("[Polar webhook] order.paid: unknown product_id", productId);
        return;
    }

    const creditsToAdd = plan === "pro" ? CREDITS_PRO : CREDITS_ULTRA;

    const { data: existingUser } = await supabase
        .from("users")
        .select("plan, credits")
        .eq("id", userId)
        .single();

    const previousPlan = (existingUser?.plan as Plan) ?? "free";
    let credits = creditsToAdd;
    if (plan === "ultra" && previousPlan === "pro") {
        credits = CREDITS_UPGRADE_DELTA;
    }

    const { error: insertError } = await supabase.from("payments").insert({
        user_id: userId,
        amount: amountCents,
        status: "completed",
        plan,
        credits,
        polar_order_id: order.id,
    });
    if (insertError) {
        console.error("[Polar webhook] order.paid: payments insert failed", insertError);
        return;
    }

    const currentCredits = (existingUser?.credits as number) ?? 0;
    const updatedCredits = currentCredits + credits;

    const { error: upsertError } = await supabase.from("users").upsert(
        {
            id: userId,
            plan,
            credits: updatedCredits,
            subscription_status: "active",
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );
    if (upsertError) console.error("[Polar webhook] order.paid: failed to upsert users", upsertError);
}

/** customer.state_changed payload.data (CustomerState) - SDK camelCase */
interface SubscriptionLike {
    status?: string;
    productId?: string;
    product?: { id?: string };
}

interface CustomerStateData {
    externalId?: string | null;
    activeSubscriptions?: SubscriptionLike[] | null;
    grantedBenefits?: unknown[];
}

export async function handleCustomerStateChanged(data: CustomerStateData): Promise<void> {
    const userId = data.externalId ?? null;
    if (!userId) {
        console.warn("[Polar webhook] customer.state_changed: no externalId");
        return;
    }

    const supabase = createSupabaseAdmin();
    const subs = data.activeSubscriptions ?? [];
    const activeSub = subs.find((s) => s.status === "active" || s.status === "trialing");
    const productId = activeSub?.productId ?? activeSub?.product?.id;
    const plan: Plan = productId ? productIdToPlan(productId) : "free";

    // DB check: active | inactive | cancelled | expired
    let subscriptionStatus: "active" | "inactive" | "cancelled" | "expired" = "inactive";
    if (subs.length > 0) {
        const hasActive = subs.some((s) => s.status === "active" || s.status === "trialing");
        const hasCanceled = subs.some((s) => s.status === "canceled");
        if (hasActive) subscriptionStatus = "active";
        else if (hasCanceled) subscriptionStatus = "cancelled";
        else subscriptionStatus = "expired";
    }

    const { error } = await supabase.from("users").upsert(
        {
            id: userId,
            plan,
            subscription_status: subscriptionStatus,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
    );

    if (error) {
        const { error: updateError } = await supabase
            .from("users")
            .update({
                plan,
                subscription_status: subscriptionStatus,
                updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        if (updateError) console.error("[Polar webhook] customer.state_changed: failed to update users", updateError);
    }
}
