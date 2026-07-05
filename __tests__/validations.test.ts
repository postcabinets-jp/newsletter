import { describe, it, expect } from "vitest";
import {
  CreateCampaignSchema,
  UpdateCampaignSchema,
  ScheduleCampaignSchema,
  CampaignIdSchema,
  CampaignEventSchema,
  AddSubscriberSchema,
  UpdateSubscriberSchema,
  DeleteSubscriberSchema,
  UnsubscribeSchema,
  ImportCsvRowSchema,
  CreatePublicationSchema,
  UpdatePublicationSchema,
  CreateTagSchema,
  UpdateTagSchema,
  DeleteTagSchema,
  AssignTagSchema,
  BulkAssignTagSchema,
  CreateAutomationSchema,
  CreateFormSchema,
  CreateSubscriptionPlanSchema,
  CreateApiKeySchema,
} from "@/lib/validations";

// ── Helpers ──

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_2 = "550e8400-e29b-41d4-a716-446655440001";
const VALID_UUID_3 = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";
const VALID_EMAIL = "test@example.com";
const VALID_DATETIME = "2026-07-05T10:00:00+09:00";
const VALID_HEX_COLOR = "#ff5733";

// ── CreateCampaignSchema ──

describe("CreateCampaignSchema", () => {
  it("accepts valid input with subject only", () => {
    const result = CreateCampaignSchema.safeParse({ subject: "Weekly Digest" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with all fields", () => {
    const result = CreateCampaignSchema.safeParse({
      subject: "Weekly Digest",
      preview_text: "This week in tech",
      content_html: "<h1>Hello</h1>",
      content_json: { type: "doc", content: [] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty subject", () => {
    const result = CreateCampaignSchema.safeParse({ subject: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing subject", () => {
    const result = CreateCampaignSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts optional fields as undefined", () => {
    const result = CreateCampaignSchema.safeParse({
      subject: "test",
      preview_text: undefined,
      content_html: undefined,
      content_json: undefined,
    });
    expect(result.success).toBe(true);
  });

  it("accepts content_json with nested objects", () => {
    const result = CreateCampaignSchema.safeParse({
      subject: "test",
      content_json: { blocks: [{ type: "text", data: { text: "hello" } }] },
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content_json).toHaveProperty("blocks");
    }
  });
});

// ── UpdateCampaignSchema ──

describe("UpdateCampaignSchema", () => {
  it("accepts valid update with id and subject", () => {
    const result = UpdateCampaignSchema.safeParse({
      id: VALID_UUID,
      subject: "Updated Subject",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID for id", () => {
    const result = UpdateCampaignSchema.safeParse({
      id: "not-a-uuid",
      subject: "test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing id", () => {
    const result = UpdateCampaignSchema.safeParse({ subject: "test" });
    expect(result.success).toBe(false);
  });

  it("accepts id-only (all updates optional)", () => {
    const result = UpdateCampaignSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects empty string subject when provided", () => {
    const result = UpdateCampaignSchema.safeParse({
      id: VALID_UUID,
      subject: "",
    });
    expect(result.success).toBe(false);
  });
});

// ── ScheduleCampaignSchema ──

describe("ScheduleCampaignSchema", () => {
  it("accepts valid schedule with offset datetime", () => {
    const result = ScheduleCampaignSchema.safeParse({
      id: VALID_UUID,
      send_at: VALID_DATETIME,
    });
    expect(result.success).toBe(true);
  });

  it("accepts UTC datetime with Z suffix", () => {
    const result = ScheduleCampaignSchema.safeParse({
      id: VALID_UUID,
      send_at: "2026-07-05T01:00:00Z",
    });
    expect(result.success).toBe(true);
  });

  it("rejects non-ISO datetime string", () => {
    const result = ScheduleCampaignSchema.safeParse({
      id: VALID_UUID,
      send_at: "tomorrow at 3pm",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing send_at", () => {
    const result = ScheduleCampaignSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(false);
  });

  it("rejects date-only (no time component)", () => {
    const result = ScheduleCampaignSchema.safeParse({
      id: VALID_UUID,
      send_at: "2026-07-05",
    });
    expect(result.success).toBe(false);
  });
});

// ── CampaignIdSchema ──

describe("CampaignIdSchema", () => {
  it("accepts valid UUID", () => {
    const result = CampaignIdSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID", () => {
    const result = CampaignIdSchema.safeParse({ id: "abc123" });
    expect(result.success).toBe(false);
  });

  it("rejects empty string", () => {
    const result = CampaignIdSchema.safeParse({ id: "" });
    expect(result.success).toBe(false);
  });

  it("rejects number", () => {
    const result = CampaignIdSchema.safeParse({ id: 123 });
    expect(result.success).toBe(false);
  });
});

// ── CampaignEventSchema ──

describe("CampaignEventSchema", () => {
  it("accepts valid event without url", () => {
    const result = CampaignEventSchema.safeParse({
      campaign_id: VALID_UUID,
      subscriber_id: VALID_UUID_2,
      event_type: "open",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid event with url", () => {
    const result = CampaignEventSchema.safeParse({
      campaign_id: VALID_UUID,
      subscriber_id: VALID_UUID_2,
      event_type: "click",
      url: "https://example.com/article",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid event types", () => {
    const types = [
      "delivered",
      "open",
      "click",
      "unsubscribe",
      "bounce",
      "complaint",
      "spam_report",
    ] as const;
    for (const event_type of types) {
      const result = CampaignEventSchema.safeParse({
        campaign_id: VALID_UUID,
        subscriber_id: VALID_UUID_2,
        event_type,
      });
      expect(result.success, `event_type "${event_type}" should be valid`).toBe(
        true
      );
    }
  });

  it("rejects invalid event_type", () => {
    const result = CampaignEventSchema.safeParse({
      campaign_id: VALID_UUID,
      subscriber_id: VALID_UUID_2,
      event_type: "purchased",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid url format", () => {
    const result = CampaignEventSchema.safeParse({
      campaign_id: VALID_UUID,
      subscriber_id: VALID_UUID_2,
      event_type: "click",
      url: "not a url",
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-UUID campaign_id", () => {
    const result = CampaignEventSchema.safeParse({
      campaign_id: "bad-id",
      subscriber_id: VALID_UUID_2,
      event_type: "open",
    });
    expect(result.success).toBe(false);
  });
});

// ── AddSubscriberSchema ──

describe("AddSubscriberSchema", () => {
  it("accepts valid email only", () => {
    const result = AddSubscriberSchema.safeParse({ email: VALID_EMAIL });
    expect(result.success).toBe(true);
  });

  it("accepts valid email with all optional fields", () => {
    const result = AddSubscriberSchema.safeParse({
      email: VALID_EMAIL,
      first_name: "Taro",
      last_name: "Yamada",
      source: "website",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.first_name).toBe("Taro");
    }
  });

  it("rejects invalid email", () => {
    const result = AddSubscriberSchema.safeParse({ email: "not-email" });
    expect(result.success).toBe(false);
  });

  it("rejects missing email", () => {
    const result = AddSubscriberSchema.safeParse({ first_name: "Taro" });
    expect(result.success).toBe(false);
  });

  it("rejects empty email string", () => {
    const result = AddSubscriberSchema.safeParse({ email: "" });
    expect(result.success).toBe(false);
  });

  it("accepts email with plus addressing", () => {
    const result = AddSubscriberSchema.safeParse({
      email: "user+newsletter@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("accepts email with subdomain", () => {
    const result = AddSubscriberSchema.safeParse({
      email: "user@mail.example.co.jp",
    });
    expect(result.success).toBe(true);
  });
});

// ── UpdateSubscriberSchema ──

describe("UpdateSubscriberSchema", () => {
  it("accepts valid update with id only", () => {
    const result = UpdateSubscriberSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });

  it("accepts status change to unsubscribed", () => {
    const result = UpdateSubscriberSchema.safeParse({
      id: VALID_UUID,
      status: "unsubscribed",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid statuses", () => {
    const statuses = [
      "active",
      "unsubscribed",
      "bounced",
      "complained",
      "pending",
    ] as const;
    for (const status of statuses) {
      const result = UpdateSubscriberSchema.safeParse({
        id: VALID_UUID,
        status,
      });
      expect(result.success, `status "${status}" should be valid`).toBe(true);
    }
  });

  it("rejects invalid status", () => {
    const result = UpdateSubscriberSchema.safeParse({
      id: VALID_UUID,
      status: "deleted",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email when provided", () => {
    const result = UpdateSubscriberSchema.safeParse({
      id: VALID_UUID,
      email: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid UUID for id", () => {
    const result = UpdateSubscriberSchema.safeParse({
      id: "not-uuid",
      email: VALID_EMAIL,
    });
    expect(result.success).toBe(false);
  });
});

// ── DeleteSubscriberSchema & UnsubscribeSchema ──

describe("DeleteSubscriberSchema", () => {
  it("accepts valid UUID", () => {
    expect(
      DeleteSubscriberSchema.safeParse({ id: VALID_UUID }).success
    ).toBe(true);
  });

  it("rejects invalid UUID", () => {
    expect(
      DeleteSubscriberSchema.safeParse({ id: "invalid" }).success
    ).toBe(false);
  });
});

describe("UnsubscribeSchema", () => {
  it("accepts valid UUID", () => {
    expect(UnsubscribeSchema.safeParse({ id: VALID_UUID }).success).toBe(
      true
    );
  });

  it("rejects missing id", () => {
    expect(UnsubscribeSchema.safeParse({}).success).toBe(false);
  });
});

// ── ImportCsvRowSchema ──

describe("ImportCsvRowSchema", () => {
  it("accepts valid row with email only", () => {
    const result = ImportCsvRowSchema.safeParse({ email: VALID_EMAIL });
    expect(result.success).toBe(true);
  });

  it("accepts row with all fields", () => {
    const result = ImportCsvRowSchema.safeParse({
      email: "csv@import.com",
      first_name: "CSV",
      last_name: "User",
      source: "csv_import",
    });
    expect(result.success).toBe(true);
  });

  it("rejects row with invalid email", () => {
    const result = ImportCsvRowSchema.safeParse({ email: "bad_email" });
    expect(result.success).toBe(false);
  });

  it("returns custom error message for invalid email", () => {
    const result = ImportCsvRowSchema.safeParse({ email: "bad" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msg = result.error.issues[0]?.message;
      expect(msg).toBe("有効なメールアドレスを入力してください");
    }
  });
});

// ── CreatePublicationSchema ──

describe("CreatePublicationSchema", () => {
  it("accepts valid publication", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "My Org",
      name: "Tech Newsletter",
      slug: "tech-newsletter",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with description", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "My Org",
      name: "Tech Newsletter",
      slug: "tech-newsletter",
      description: "A weekly tech digest",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty org_name", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "",
      name: "Tech",
      slug: "tech",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "",
      slug: "tech",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with uppercase", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "Tech",
      slug: "Tech-News",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with spaces", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "Tech",
      slug: "tech news",
    });
    expect(result.success).toBe(false);
  });

  it("rejects slug with underscores", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "Tech",
      slug: "tech_news",
    });
    expect(result.success).toBe(false);
  });

  it("accepts slug with hyphens and numbers", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "Tech",
      slug: "tech-news-2026",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty slug", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "Tech",
      slug: "",
    });
    expect(result.success).toBe(false);
  });

  it("returns Japanese error for invalid slug", () => {
    const result = CreatePublicationSchema.safeParse({
      org_name: "Org",
      name: "Tech",
      slug: "INVALID SLUG!",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const msgs = result.error.issues.map((i) => i.message);
      expect(msgs.some((m) => m.includes("小文字英数字"))).toBe(true);
    }
  });
});

// ── UpdatePublicationSchema ──

describe("UpdatePublicationSchema", () => {
  it("accepts valid update with name", () => {
    const result = UpdatePublicationSchema.safeParse({
      name: "New Name",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid slug update", () => {
    const result = UpdatePublicationSchema.safeParse({
      slug: "new-slug",
    });
    expect(result.success).toBe(true);
  });

  it("accepts empty object (all optional)", () => {
    const result = UpdatePublicationSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects invalid slug format in update", () => {
    const result = UpdatePublicationSchema.safeParse({
      slug: "Bad Slug!",
    });
    expect(result.success).toBe(false);
  });
});

// ── CreateTagSchema ──

describe("CreateTagSchema", () => {
  it("accepts valid tag with name only", () => {
    const result = CreateTagSchema.safeParse({ name: "VIP" });
    expect(result.success).toBe(true);
  });

  it("accepts tag with valid hex color", () => {
    const result = CreateTagSchema.safeParse({
      name: "Premium",
      color: VALID_HEX_COLOR,
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateTagSchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 50 characters", () => {
    const result = CreateTagSchema.safeParse({
      name: "a".repeat(51),
    });
    expect(result.success).toBe(false);
  });

  it("accepts name exactly 50 characters", () => {
    const result = CreateTagSchema.safeParse({
      name: "a".repeat(50),
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid color format (no hash)", () => {
    const result = CreateTagSchema.safeParse({
      name: "tag",
      color: "ff5733",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format (short)", () => {
    const result = CreateTagSchema.safeParse({
      name: "tag",
      color: "#f57",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format (8 digits)", () => {
    const result = CreateTagSchema.safeParse({
      name: "tag",
      color: "#ff5733aa",
    });
    expect(result.success).toBe(false);
  });

  it("accepts uppercase hex color", () => {
    const result = CreateTagSchema.safeParse({
      name: "tag",
      color: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it("accepts mixed case hex color", () => {
    const result = CreateTagSchema.safeParse({
      name: "tag",
      color: "#aAbBcC",
    });
    expect(result.success).toBe(true);
  });
});

// ── UpdateTagSchema ──

describe("UpdateTagSchema", () => {
  it("accepts valid update with id and name", () => {
    const result = UpdateTagSchema.safeParse({
      id: VALID_UUID,
      name: "Updated Tag",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid update with id and color", () => {
    const result = UpdateTagSchema.safeParse({
      id: VALID_UUID,
      color: "#00ff00",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid UUID for id", () => {
    const result = UpdateTagSchema.safeParse({
      id: "not-uuid",
      name: "test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts id-only (all updates optional)", () => {
    const result = UpdateTagSchema.safeParse({ id: VALID_UUID });
    expect(result.success).toBe(true);
  });
});

// ── DeleteTagSchema ──

describe("DeleteTagSchema", () => {
  it("accepts valid UUID", () => {
    expect(DeleteTagSchema.safeParse({ id: VALID_UUID }).success).toBe(true);
  });

  it("rejects non-UUID string", () => {
    expect(DeleteTagSchema.safeParse({ id: "abc" }).success).toBe(false);
  });
});

// ── AssignTagSchema ──

describe("AssignTagSchema", () => {
  it("accepts valid subscriber_id and tag_id", () => {
    const result = AssignTagSchema.safeParse({
      subscriber_id: VALID_UUID,
      tag_id: VALID_UUID_2,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid subscriber_id", () => {
    const result = AssignTagSchema.safeParse({
      subscriber_id: "bad",
      tag_id: VALID_UUID_2,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid tag_id", () => {
    const result = AssignTagSchema.safeParse({
      subscriber_id: VALID_UUID,
      tag_id: "bad",
    });
    expect(result.success).toBe(false);
  });

  it("rejects both invalid", () => {
    const result = AssignTagSchema.safeParse({
      subscriber_id: "x",
      tag_id: "y",
    });
    expect(result.success).toBe(false);
  });
});

// ── BulkAssignTagSchema ──

describe("BulkAssignTagSchema", () => {
  it("accepts single UUID in comma-separated string", () => {
    const result = BulkAssignTagSchema.parse({
      subscriber_ids: VALID_UUID,
      tag_id: VALID_UUID_2,
    });
    expect(result.subscriber_ids).toEqual([VALID_UUID]);
  });

  it("accepts multiple UUIDs in comma-separated string", () => {
    const result = BulkAssignTagSchema.parse({
      subscriber_ids: `${VALID_UUID},${VALID_UUID_2},${VALID_UUID_3}`,
      tag_id: VALID_UUID,
    });
    expect(result.subscriber_ids).toHaveLength(3);
  });

  it("trims whitespace around UUIDs", () => {
    const result = BulkAssignTagSchema.parse({
      subscriber_ids: ` ${VALID_UUID} , ${VALID_UUID_2} `,
      tag_id: VALID_UUID_3,
    });
    expect(result.subscriber_ids).toEqual([VALID_UUID, VALID_UUID_2]);
  });

  it("throws on empty subscriber_ids string", () => {
    expect(() =>
      BulkAssignTagSchema.parse({
        subscriber_ids: "",
        tag_id: VALID_UUID,
      })
    ).toThrow();
  });

  it("throws on invalid UUID in the list", () => {
    expect(() =>
      BulkAssignTagSchema.parse({
        subscriber_ids: `${VALID_UUID},not-a-uuid`,
        tag_id: VALID_UUID_2,
      })
    ).toThrow("不正なUUID");
  });

  it("throws on whitespace-only subscriber_ids", () => {
    expect(() =>
      BulkAssignTagSchema.parse({
        subscriber_ids: "   ,  , ",
        tag_id: VALID_UUID,
      })
    ).toThrow();
  });
});

// ── CreateAutomationSchema ──

describe("CreateAutomationSchema", () => {
  it("accepts valid automation with required fields", () => {
    const result = CreateAutomationSchema.safeParse({
      name: "Welcome Series",
      trigger_type: "subscriber_added",
    });
    expect(result.success).toBe(true);
  });

  it("accepts with trigger_config and flow_json", () => {
    const result = CreateAutomationSchema.safeParse({
      name: "Tag Welcome",
      trigger_type: "tag_added",
      trigger_config: { tag_id: VALID_UUID },
      flow_json: { steps: [] },
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid trigger types", () => {
    const types = [
      "subscriber_added",
      "tag_added",
      "tag_removed",
      "paid_subscription_started",
      "paid_subscription_cancelled",
      "campaign_link_clicked",
    ] as const;
    for (const trigger_type of types) {
      const result = CreateAutomationSchema.safeParse({
        name: "Test",
        trigger_type,
      });
      expect(
        result.success,
        `trigger_type "${trigger_type}" should be valid`
      ).toBe(true);
    }
  });

  it("rejects invalid trigger_type", () => {
    const result = CreateAutomationSchema.safeParse({
      name: "Test",
      trigger_type: "form_submitted",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = CreateAutomationSchema.safeParse({
      name: "",
      trigger_type: "subscriber_added",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = CreateAutomationSchema.safeParse({
      trigger_type: "subscriber_added",
    });
    expect(result.success).toBe(false);
  });
});

// ── CreateFormSchema ──

describe("CreateFormSchema", () => {
  it("accepts valid form with required fields", () => {
    const result = CreateFormSchema.safeParse({
      name: "Signup Form",
      type: "inline",
    });
    expect(result.success).toBe(true);
  });

  it("accepts all valid form types", () => {
    for (const type of ["inline", "popup", "standalone"] as const) {
      const result = CreateFormSchema.safeParse({ name: "Form", type });
      expect(result.success, `type "${type}" should be valid`).toBe(true);
    }
  });

  it("rejects invalid form type", () => {
    const result = CreateFormSchema.safeParse({
      name: "Form",
      type: "embedded",
    });
    expect(result.success).toBe(false);
  });

  it("accepts form with config", () => {
    const result = CreateFormSchema.safeParse({
      name: "Popup Form",
      type: "popup",
      config: { delay_seconds: 5, show_on: "scroll_50" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateFormSchema.safeParse({ name: "", type: "inline" });
    expect(result.success).toBe(false);
  });
});

// ── CreateSubscriptionPlanSchema ──

describe("CreateSubscriptionPlanSchema", () => {
  it("accepts valid plan", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Pro Monthly",
      stripe_price_id: "price_1234567890",
      amount_cents: 1000,
      interval: "month",
    });
    expect(result.success).toBe(true);
  });

  it("defaults currency to jpy", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Pro",
      stripe_price_id: "price_abc",
      amount_cents: 500,
      interval: "year",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("jpy");
    }
  });

  it("accepts explicit currency", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Pro USD",
      stripe_price_id: "price_abc",
      amount_cents: 999,
      currency: "usd",
      interval: "month",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("usd");
    }
  });

  it("rejects currency with wrong length", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Plan",
      stripe_price_id: "price_x",
      amount_cents: 100,
      currency: "us",
      interval: "month",
    });
    expect(result.success).toBe(false);
  });

  it("accepts zero amount", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Free Plan",
      stripe_price_id: "price_free",
      amount_cents: 0,
      interval: "month",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Bad Plan",
      stripe_price_id: "price_bad",
      amount_cents: -100,
      interval: "month",
    });
    expect(result.success).toBe(false);
  });

  it("rejects decimal amount", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Decimal Plan",
      stripe_price_id: "price_dec",
      amount_cents: 9.99,
      interval: "month",
    });
    expect(result.success).toBe(false);
  });

  it("accepts all valid intervals", () => {
    for (const interval of ["month", "year", "one_time"] as const) {
      const result = CreateSubscriptionPlanSchema.safeParse({
        name: "Plan",
        stripe_price_id: "price_x",
        amount_cents: 100,
        interval,
      });
      expect(result.success, `interval "${interval}" should be valid`).toBe(
        true
      );
    }
  });

  it("rejects invalid interval", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Plan",
      stripe_price_id: "price_x",
      amount_cents: 100,
      interval: "weekly",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty stripe_price_id", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Plan",
      stripe_price_id: "",
      amount_cents: 100,
      interval: "month",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "",
      stripe_price_id: "price_x",
      amount_cents: 100,
      interval: "month",
    });
    expect(result.success).toBe(false);
  });

  it("accepts with optional description", () => {
    const result = CreateSubscriptionPlanSchema.safeParse({
      name: "Pro",
      description: "Full access to all features",
      stripe_price_id: "price_x",
      amount_cents: 1000,
      interval: "month",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe("Full access to all features");
    }
  });
});

// ── CreateApiKeySchema ──

describe("CreateApiKeySchema", () => {
  it("accepts valid name", () => {
    const result = CreateApiKeySchema.safeParse({ name: "Production Key" });
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    const result = CreateApiKeySchema.safeParse({ name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 100 characters", () => {
    const result = CreateApiKeySchema.safeParse({ name: "x".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("accepts name exactly 100 characters", () => {
    const result = CreateApiKeySchema.safeParse({ name: "x".repeat(100) });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = CreateApiKeySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ── Cross-cutting edge cases ──

describe("Cross-cutting edge cases", () => {
  it("all ID schemas reject null", () => {
    expect(CampaignIdSchema.safeParse({ id: null }).success).toBe(false);
    expect(DeleteSubscriberSchema.safeParse({ id: null }).success).toBe(false);
    expect(DeleteTagSchema.safeParse({ id: null }).success).toBe(false);
    expect(UnsubscribeSchema.safeParse({ id: null }).success).toBe(false);
  });

  it("all ID schemas reject undefined", () => {
    expect(CampaignIdSchema.safeParse({}).success).toBe(false);
    expect(DeleteSubscriberSchema.safeParse({}).success).toBe(false);
    expect(DeleteTagSchema.safeParse({}).success).toBe(false);
    expect(UnsubscribeSchema.safeParse({}).success).toBe(false);
  });

  it("email schemas accept internationalized domain", () => {
    const result = AddSubscriberSchema.safeParse({
      email: "user@example.co.jp",
    });
    expect(result.success).toBe(true);
  });

  it("CreateCampaignSchema preserves content_json structure", () => {
    const json = { version: 1, blocks: [{ type: "heading", text: "Hi" }] };
    const result = CreateCampaignSchema.safeParse({
      subject: "Test",
      content_json: json,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.content_json).toEqual(json);
    }
  });

  it("UpdateSubscriberSchema allows partial updates", () => {
    const result = UpdateSubscriberSchema.safeParse({
      id: VALID_UUID,
      first_name: "New",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
      expect(result.data.status).toBeUndefined();
    }
  });
});
