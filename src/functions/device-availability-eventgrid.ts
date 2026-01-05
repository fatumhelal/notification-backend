import { app, EventGridEvent, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

type DeviceAvailabilityEvent = {
  deviceModel: string;
  availableCount: number;
  timestamp: string;
};

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const container = client
  .database("devices-db")
  .container("subscriptions");

export async function deviceAvailabilityEventGrid(
  event: EventGridEvent,
  context: InvocationContext
): Promise<void> {
  context.log("📨 Event Grid event received");
  context.log(JSON.stringify(event, null, 2));

  const data = event.data as DeviceAvailabilityEvent;

  context.log("🔔 Device availability update:", {
    model: data.deviceModel,
    available: data.availableCount,
    at: data.timestamp,
  });

  // Only notify when availability increases
  if (data.availableCount <= 0) {
    context.log("ℹ️ No availability – skipping notification");
    return;
  }

  // 🔎 Find subscribers for this device model
  const query = {
    query: "SELECT * FROM c WHERE c.modelKey = @model",
    parameters: [{ name: "@model", value: data.deviceModel }],
  };

  const { resources } = await container.items.query(query).fetchAll();

  if (resources.length === 0) {
    context.log("ℹ️ No subscribers for model", data.deviceModel);
    return;
  }

  const emails = resources.map((r: any) => r.email);

  // 📧 Notification sink (no real email required)
  context.log("📧 Would notify subscribers:", {
    model: data.deviceModel,
    emails,
    correlationTimestamp: data.timestamp,
  });
}

app.eventGrid("deviceAvailabilityEventGrid", {
  handler: deviceAvailabilityEventGrid,
});
