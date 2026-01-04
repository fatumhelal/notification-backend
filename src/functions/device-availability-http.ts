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
  
  function isIsoDateString(value: unknown): value is string {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime()) && value === date.toISOString();
  }
  
  function validatePayload(
    body: any
  ):
    | { ok: true; data: DeviceAvailabilityEvent }
    | { ok: false; errors: string[] } {
    const errors: string[] = [];
  
    if (!body || typeof body !== 'object') {
      return { ok: false, errors: ['Body must be a JSON object'] };
    }
  
    const { deviceModel, availableCount, timestamp } =
      body as Partial<DeviceAvailabilityEvent>;
  
    if (typeof deviceModel !== 'string' || deviceModel.trim() === '') {
      errors.push('deviceModel must be a non-empty string');
    }
  
    if (
      typeof availableCount !== 'number' ||
      !Number.isInteger(availableCount) ||
      availableCount < 0
    ) {
      errors.push('availableCount must be a non-negative integer');
    }
  
    if (!isIsoDateString(timestamp)) {
      errors.push('timestamp must be an ISO string');
    }
  
    if (errors.length > 0) {
      return { ok: false, errors };
    }
  
    return {
      ok: true,
      data: { deviceModel, availableCount, timestamp },
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
      const errors = (result as { ok: false; errors: string[] }).errors;
    
      return {
        status: 400,
        jsonBody: { error: 'ValidationError', details: errors },
      };
    }    
  
    // Sink / notification placeholder
    context.log('🔔 Device availability event:', result.data);
  
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
  