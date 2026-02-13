"use client";

import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function TestSupabase() {
    const [status, setStatus] = useState<"loading" | "connected" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const supabase = createClient();
                // Try to get the session to check if the client is configured correctly
                const { data, error } = await supabase.auth.getSession();

                if (error) {
                    throw error;
                }

                setStatus("connected");
                setMessage("Supabase connection successful! (Auth service reachable)");
            } catch (err: any) {
                setStatus("error");
                setMessage(err.message || "Failed to connect to Supabase");
                console.error("Supabase connection error:", err);
            }
        };

        checkConnection();
    }, []);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white p-4">
            <h1 className="text-2xl font-bold mb-4">Supabase Connection Test</h1>

            {status === "loading" && <p className="text-yellow-400">Testing connection...</p>}

            {status === "connected" && (
                <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg text-green-400">
                    <p className="font-semibold">✅ Success</p>
                    <p>{message}</p>
                </div>
            )}

            {status === "error" && (
                <div className="p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">
                    <p className="font-semibold">❌ Error</p>
                    <p>{message}</p>
                    <p className="text-sm mt-2 text-neutral-400">Check your .env.local file credentials.</p>
                </div>
            )}
        </div>
    );
}
