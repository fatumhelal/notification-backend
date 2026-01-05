import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from '@azure/functions';

type DeviceAvailabilityEvent = {
  deviceModel: string;
  availableCount: number;
  timestamp: string;
};

function validatePayload(
  body: unknown
):
  | { ok: true; data: DeviceAvailabilityEvent }
  | { ok: false; errors: string[] } {

  const errors: string[] = [];

  if (typeof body !== 'object' || body === null) {
    return { ok: false, errors: ['Body must be a JSON object'] };
  }

  const record = body as Record<string, unknown>;

  if (typeof record.deviceModel !== 'string' || record.deviceModel.trim() === '') {
    errors.push('deviceModel must be a non-empty string');
  }

  if (
    typeof record.availableCount !== 'number' ||
    !Number.isInteger(record.availableCount) ||
    record.availableCount < 0
  ) {
    errors.push('availableCount must be a non-negative integer');
  }

  if (
    typeof record.timestamp !== 'string' ||
    isNaN(Date.parse(record.timestamp))
  ) {
    errors.push('timestamp must be an ISO string');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  // ✅ Explicit narrowing after validation
  const deviceModel = record.deviceModel as string;
  const availableCount = record.availableCount as number;
  const timestamp = record.timestamp as string;

  return {
    ok: true,
    data: {
      deviceModel,
      availableCount,
      timestamp,
    },
  };
}

async function deviceAvailabilityHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log('📨 Device availability notification received');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      status: 400,
      jsonBody: { error: 'Invalid JSON body' },
    };
  }

  const result = validatePayload(body);

  if (!result.ok) {
    return {
      status: 400,
      jsonBody: {
        error: 'ValidationError',
        details: result.errors,
      },
    };
  }

  // 🔔 Notification sink (no email needed)
  context.log('🔔 Device availability event accepted:', result.data);

  return {
    status: 202,
    jsonBody: { message: 'accepted' },
  };
}

app.http('device-availability-http', {
  route: 'integration/events/device-availability',
  methods: ['POST'],
  authLevel: 'function', // 🔐 HOST KEY REQUIRED
  handler: deviceAvailabilityHandler,
});
