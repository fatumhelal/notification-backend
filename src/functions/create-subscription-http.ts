import './device-availability-http';
import './device-availability-eventgrid';
import './health-http';

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

type SubscriptionRequest = {
  model: string;
  email: string;
};

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING!);
const container = client
  .database("devices-db")
  .container("subscriptions");

export async function createSubscription(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {

  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return {
      status: 400,
      jsonBody: { message: "Invalid JSON body" },
    };
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as any).model !== "string" ||
    typeof (body as any).email !== "string"
  ) {
    return {
      status: 400,
      jsonBody: { message: "model and email are required" },
    };
  }

  const data = body as SubscriptionRequest;

  const doc = {
    id: `${data.email}-${data.model}`,
    modelKey: data.model,
    email: data.email,
    createdAt: new Date().toISOString(),
  };

  await container.items.upsert(doc);

  context.log("Subscription stored:", doc);

  return {
    status: 201,
    jsonBody: { message: "Subscribed successfully" },
  };
}

app.http("create-subscription", {
  route: "subscriptions",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: createSubscription,
});
