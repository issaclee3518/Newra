import { Webhooks } from "@polar-sh/nextjs";
import {
    handleOrderPaid,
    handleCustomerStateChanged,
} from "@/lib/webhooks/polar-handlers";

export const POST = Webhooks({
    webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
    onOrderPaid: async (payload) => {
        try {
            console.log("[Polar webhook] order.paid received", (payload.data as { id?: string })?.id);
            await handleOrderPaid(payload.data as Parameters<typeof handleOrderPaid>[0]);
        } catch (e) {
            console.error("[Polar webhook] onOrderPaid error:", e);
            throw e;
        }
    },
    onCustomerStateChanged: async (payload) => {
        try {
            console.log("[Polar webhook] customer.state_changed received");
            await handleCustomerStateChanged(payload.data as Parameters<typeof handleCustomerStateChanged>[0]);
        } catch (e) {
            console.error("[Polar webhook] onCustomerStateChanged error:", e);
            throw e;
        }
    },
});
