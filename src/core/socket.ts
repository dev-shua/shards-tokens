import { MODULE_ID } from "@utils/constants";

const SOCKET_EVENT = `module.${MODULE_ID}`;

// Example payload type:
// type ExamplePayload = {
//   someData: string;
//   someNumber: number;
// };

export function registerSocket(): void {
  game.socket?.on(SOCKET_EVENT, (payload: unknown) => {
    // Handle messages received from the GM
    // void handlePayload(payload as ExamplePayload);
  });
}

// Emit a message to all clients (GM included)
// export function emitExample(payload: ExamplePayload): void {
//   game.socket?.emit(SOCKET_EVENT, payload);
//   void handlePayload(payload); // also applies to the GM locally
// }

// Local handler
// async function handlePayload(payload: ExamplePayload): Promise<void> {
//   // ...
// }