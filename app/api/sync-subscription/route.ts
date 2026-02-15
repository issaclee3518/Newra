import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { handleOrderPaid } from "@/lib/webhooks/polar-handlers";

const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN!;

/** Polar API가 반환하는 주문 (snake_case) */
interface PolarOrder {
    id: string;
    customer_id: string;
    product_id?: string | null;
    total_amount?: number;
    paid?: boolean;
    status?: string;
    customer?: { external_id?: string | null };
    items?: Array<{ product_id?: string }>;
}

/**
 * 로그인한 사용자의 Polar 결제 내역을 가져와서 payments / users에 동기화합니다.
 * 웹훅이 오지 않았을 때(로컬 개발, 네트워크 문제 등) 대시보드 진입 시 호출합니다.
 */
export async function POST() {
    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "인증이 필요합니다." }, { status: 401 });
        }

        if (!POLAR_ACCESS_TOKEN) {
            return NextResponse.json(
                { error: "POLAR_ACCESS_TOKEN이 설정되지 않았습니다." },
                { status: 500 }
            );
        }

        const res = await fetch(
            `https://api.polar.sh/v1/orders?external_customer_id=${encodeURIComponent(user.id)}&limit=100`,
            {
                headers: {
                    Authorization: `Bearer ${POLAR_ACCESS_TOKEN}`,
                    Accept: "application/json",
                },
            }
        );

        if (!res.ok) {
            const text = await res.text();
            console.error("[sync-subscription] Polar orders list failed", res.status, text);
            return NextResponse.json(
                { error: "Polar 결제 내역을 가져오지 못했습니다." },
                { status: 502 }
            );
        }

        const data = (await res.json()) as { items?: PolarOrder[] };
        const orders = data.items ?? [];
        const paidOrders = orders.filter(
            (o) => (o.paid === true || o.status === "paid") && (o.product_id || o.items?.[0]?.product_id)
        );

        const { data: existingPayments } = await supabase
            .from("payments")
            .select("polar_order_id")
            .eq("user_id", user.id);
        const existingOrderIds = new Set((existingPayments ?? []).map((p) => p.polar_order_id).filter(Boolean));

        let synced = 0;
        for (const order of paidOrders) {
            if (existingOrderIds.has(order.id)) continue;
            const orderForHandler: Parameters<typeof handleOrderPaid>[0] = {
                id: order.id,
                customer_id: order.customer_id,
                customer: order.customer,
                product_id: order.product_id ?? order.items?.[0]?.product_id ?? null,
                total_amount: order.total_amount ?? 0,
            };
            await handleOrderPaid(orderForHandler);
            synced++;
        }

        return NextResponse.json({ success: true, synced });
    } catch (e) {
        console.error("[sync-subscription] error", e);
        return NextResponse.json(
            { error: "구독 정보 동기화 중 오류가 발생했습니다." },
            { status: 500 }
        );
    }
}
