import { AnemoneClient } from "anemone-server-js";
import {
  parseNetworkBody,
  redactNetworkHeaders,
  type NetworkActivityExchange,
} from "anemone-server-js/embed";
import { getUpdatePath, isPrimaryMockMode, PLATFORM_NAME } from "@/lib/config";

function newId(): string {
  return `srv-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createServerNetworkCollector(): NetworkActivityExchange[] {
  return [];
}

export function createLoggingFetch(
  sink: NetworkActivityExchange[],
  label = `${PLATFORM_NAME} primary`,
): typeof fetch {
  return async (input, init) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = (init?.method ?? "GET").toUpperCase();
    const started = Date.now();
    const startedAt = new Date(started).toISOString();

    let requestBody: unknown;
    if (typeof init?.body === "string") {
      requestBody = parseNetworkBody(init.body);
    }

    try {
      const res = await fetch(input, init);
      const text = await res.text();
      const responseBody = parseNetworkBody(text);
      const completedAt = new Date().toISOString();

      sink.push({
        id: newId(),
        label,
        startedAt,
        completedAt,
        durationMs: Date.now() - started,
        request: {
          method,
          url,
          headers: redactNetworkHeaders(init?.headers),
          body: requestBody,
        },
        response: {
          status: res.status,
          statusText: res.statusText,
          headers: redactNetworkHeaders(
            Object.fromEntries(res.headers.entries()) as Record<string, string>,
          ),
          body: responseBody,
        },
      });

      return new Response(text, {
        status: res.status,
        statusText: res.statusText,
        headers: res.headers,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Network request failed";
      sink.push({
        id: newId(),
        label,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        request: {
          method,
          url,
          headers: redactNetworkHeaders(init?.headers),
          body: requestBody,
        },
        error: message,
      });
      throw e;
    }
  };
}

export function getAnemoneClientWithNetworkLog(
  sink: NetworkActivityExchange[],
): AnemoneClient | null {
  if (isPrimaryMockMode()) return null;
  const baseUrl = process.env.ANEMONE_PRIMARY_BASE_URL!.replace(/\/$/, "");
  const apiKey = process.env.ANEMONE_API_KEY!.trim();
  return new AnemoneClient({
    baseUrl,
    apiKey,
    allowInsecureLocalhost: true,
    fetchImpl: createLoggingFetch(sink),
  });
}

export function getContactUpdatePathForServer() {
  return getUpdatePath();
}
