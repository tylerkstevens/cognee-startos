"use client";

import { useEffect, useState } from "react";
import { Tenant } from "./types";
import { TenantContext, localInstance } from "./TenantContext";
import { tokens } from "@/ui/theme/tokens";

// Use same-origin relative API calls so the browser talks to the UI server,
// which proxies to the Cognee backend internally.
const localApiUrl = "";

export function LocalProvider({ children }: { children: React.ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Guard: don't check auth if we're already on the login page (avoids redirect loop)
      if (typeof window !== "undefined" && window.location.pathname === "/local-login") {
        setIsInitializing(false);
        return;
      }

      try {
        // Check if we're authenticated with the local backend via the UI proxy
        const meResponse = await global.fetch("/api/v1/users/me", {
          credentials: "include",
        });

        if (meResponse.status === 401 || meResponse.status === 403) {
          // Not authenticated — redirect to local login
          window.location.href = "/local-login";
          return;
        }

        if (!meResponse.ok) {
          throw new Error(`Local backend returned ${meResponse.status}: ${meResponse.statusText}`);
        }

        if (cancelled) return;

        // Authenticated — set up the local instance
        setTenant({ tenant_id: "local", tenant_name: "local" });
      } catch (err) {
        if (cancelled) return;

        // Network error — backend probably not running
        if (err instanceof TypeError) {
          setError("Cannot connect to the Cognee backend through the StartOS UI proxy. Is the Cognee service running?");
        } else {
          const message = err instanceof Error ? err.message : "Failed to connect to local backend";
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error && !isInitializing) {
    return (
      <ErrorScreen message={error} />
    );
  }

  return (
    <TenantContext.Provider value={{
      tenant,
      cogniInstance: localInstance,
      localInstance,
      serviceUrl: localApiUrl,
      apiKey: "",
      isInitializing,
      tenantReady: true,
      isOwner: true,
      error,
      statusMessage: null,
      availableTenants: [],
      switchTenant: () => {},
      planType: null,
      hasAccess: true,
      requestCreateWorkspace: () => {},
      nameModalOpen: false,
      releaseLoader: () => {},
    }}>
      {children}
    </TenantContext.Provider>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      textAlign: "center",
    }}>
      <div style={{
        backgroundColor: "#ffffff",
        borderRadius: "0.75rem",
        padding: "2.5rem",
        maxWidth: "28rem",
        width: "100%",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
      }}>
        <h2 style={{ margin: "0 0 0.75rem", fontSize: "1.25rem", fontWeight: 700, color: tokens.textDark }}>
          Connection Error
        </h2>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.875rem", color: tokens.textSecondary }}>
          {message}
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: "0.5rem 1.5rem",
            borderRadius: "0.5rem",
            border: "1px solid #d1d5db",
            backgroundColor: "#ffffff",
            cursor: "pointer",
            fontSize: "0.875rem",
            fontWeight: 500,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
