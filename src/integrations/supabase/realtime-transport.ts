class ServerRealtimeTransport {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  constructor() {
    throw new Error("Supabase Realtime is only available in the browser.");
  }
}

export function getRealtimeTransport(): typeof WebSocket {
  if (typeof WebSocket !== "undefined") return WebSocket;
  return ServerRealtimeTransport as unknown as typeof WebSocket;
}