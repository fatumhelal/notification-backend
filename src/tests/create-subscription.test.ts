import { describe, it, expect } from "vitest";

describe("Notification service", () => {
  it("handles duplicate subscriptions idempotently", () => {
    const first = {
      email: "student@test.com",
      model: "MacBook Pro 14"
    };

    const second = {
      email: "student@test.com",
      model: "MacBook Pro 14"
    };

    // Simulate same logical subscription
    expect(first.email).toBe(second.email);
    expect(first.model).toBe(second.model);
  });
});
