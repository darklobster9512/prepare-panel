// Node.js 20 has no global WebSocket constructor. Supabase initializes its
// Realtime transport while creating a client, even though this application
// never opens Realtime channels during SSR or in server functions.
if (
  typeof globalThis !== "undefined" &&
  typeof (globalThis as { WebSocket?: unknown }).WebSocket === "undefined"
) {
  class ServerWebSocketStub {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSING = 2;
    static readonly CLOSED = 3;

    constructor() {
      throw new Error("WebSocket connections are not available during server rendering.");
    }
  }

  Object.defineProperty(globalThis, "WebSocket", {
    value: ServerWebSocketStub,
    configurable: true,
    writable: true,
  });
}

export {};