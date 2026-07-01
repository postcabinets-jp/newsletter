-- ========================
-- organizations（ワークスペース）
-- ========================
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  slug          text NOT NULL UNIQUE,
  plan          text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner can manage own org"
  ON organizations FOR ALL
  USING (owner_id = auth.uid());

-- ========================
-- organization_members（チームメンバー）
-- ========================
CREATE TABLE organization_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            text NOT NULL DEFAULT 'editor' CHECK (role IN ('owner', 'editor', 'analyst')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view their membership"
  ON organization_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "owner can manage members"
  ON organization_members FOR ALL
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- ========================
-- publications（ニュースレター）
-- ========================
CREATE TABLE publications (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  slug            text NOT NULL,
  description     text,
  custom_domain   text UNIQUE,
  smtp_config     jsonb,
  settings        jsonb DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, slug)
);

ALTER TABLE publications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can access publications"
  ON publications FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
      UNION
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
  );

CREATE INDEX idx_publications_org ON publications(organization_id);

-- ========================
-- subscribers
-- ========================
CREATE TABLE subscribers (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id  uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  email           text NOT NULL,
  first_name      text,
  last_name       text,
  status          text NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'unsubscribed', 'bounced', 'complained', 'pending')),
  source          text,
  utm_source      text,
  utm_medium      text,
  utm_campaign    text,
  metadata        jsonb DEFAULT '{}',
  subscribed_at   timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, email)
);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage subscribers"
  ON subscribers FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_subscribers_pub_email ON subscribers(publication_id, email);
CREATE INDEX idx_subscribers_status ON subscribers(publication_id, status);
CREATE INDEX idx_subscribers_subscribed_at ON subscribers(publication_id, subscribed_at);

-- ========================
-- tags
-- ========================
CREATE TABLE tags (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id  uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  name            text NOT NULL,
  color           text DEFAULT '#6366f1',
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (publication_id, name)
);

ALTER TABLE tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage tags"
  ON tags FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ========================
-- subscriber_tags（ジャンクション）
-- ========================
CREATE TABLE subscriber_tags (
  subscriber_id  uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  tag_id         uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  created_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (subscriber_id, tag_id)
);

ALTER TABLE subscriber_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage subscriber_tags"
  ON subscriber_tags FOR ALL
  USING (
    subscriber_id IN (
      SELECT s.id FROM subscribers s
      JOIN publications p ON p.id = s.publication_id
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT s.id FROM subscribers s
      JOIN publications p ON p.id = s.publication_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ========================
-- campaigns（ブロードキャスト）
-- ========================
CREATE TABLE campaigns (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id  uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  subject         text NOT NULL,
  preview_text    text,
  content_json    jsonb NOT NULL DEFAULT '{}',
  content_html    text,
  status          text NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
  send_at         timestamptz,
  sent_at         timestamptz,
  segment_filter  jsonb,
  ab_test         jsonb,
  stats           jsonb DEFAULT '{"sent":0,"delivered":0,"opens":0,"clicks":0,"unsubscribes":0,"bounces":0}',
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage campaigns"
  ON campaigns FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_campaigns_pub_status ON campaigns(publication_id, status);
CREATE INDEX idx_campaigns_send_at ON campaigns(send_at) WHERE status = 'scheduled';

-- ========================
-- campaign_events（開封・クリック・退会等）
-- ========================
CREATE TABLE campaign_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id    uuid NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  subscriber_id  uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  event_type     text NOT NULL CHECK (event_type IN ('delivered','open','click','unsubscribe','bounce','complaint','spam_report')),
  url            text,
  user_agent     text,
  ip_address     inet,
  occurred_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE campaign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can read campaign_events"
  ON campaign_events FOR SELECT
  USING (
    campaign_id IN (
      SELECT c.id FROM campaigns c
      JOIN publications p ON p.id = c.publication_id
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT c.id FROM campaigns c
      JOIN publications p ON p.id = c.publication_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE POLICY "service role can insert events"
  ON campaign_events FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_campaign_events_campaign ON campaign_events(campaign_id, event_type);
CREATE INDEX idx_campaign_events_subscriber ON campaign_events(subscriber_id);
CREATE INDEX idx_campaign_events_occurred ON campaign_events(occurred_at);

-- ========================
-- automations（ワークフロー）
-- ========================
CREATE TABLE automations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id  uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  name            text NOT NULL,
  trigger_type    text NOT NULL CHECK (trigger_type IN ('subscriber_added','tag_added','tag_removed','paid_subscription_started','paid_subscription_cancelled','campaign_link_clicked')),
  trigger_config  jsonb DEFAULT '{}',
  flow_json       jsonb NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  status          text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage automations"
  ON automations FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ========================
-- automation_enrollments（オートメーション実行状態）
-- ========================
CREATE TABLE automation_enrollments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id   uuid NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  subscriber_id   uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  current_step_id text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused','cancelled')),
  enrolled_at     timestamptz NOT NULL DEFAULT now(),
  next_step_at    timestamptz,
  completed_at    timestamptz,
  UNIQUE (automation_id, subscriber_id)
);

ALTER TABLE automation_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view enrollments"
  ON automation_enrollments FOR SELECT
  USING (
    automation_id IN (
      SELECT a.id FROM automations a
      JOIN publications p ON p.id = a.publication_id
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT a.id FROM automations a
      JOIN publications p ON p.id = a.publication_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE POLICY "service role can manage enrollments"
  ON automation_enrollments FOR ALL
  WITH CHECK (true)
  USING (true);

CREATE INDEX idx_enrollments_next_step ON automation_enrollments(next_step_at) WHERE status = 'active';

-- ========================
-- forms（オプトインフォーム）
-- ========================
CREATE TABLE forms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id  uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  name            text NOT NULL,
  type            text NOT NULL DEFAULT 'inline' CHECK (type IN ('inline', 'popup', 'standalone')),
  config          jsonb NOT NULL DEFAULT '{}',
  embed_code      text,
  total_views     integer NOT NULL DEFAULT 0,
  total_signups   integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage forms"
  ON forms FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ========================
-- subscription_plans（有料サブスクプラン）
-- ========================
CREATE TABLE subscription_plans (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id     uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  name               text NOT NULL,
  description        text,
  stripe_price_id    text NOT NULL,
  amount_cents       integer NOT NULL,
  currency           text NOT NULL DEFAULT 'jpy',
  interval           text NOT NULL CHECK (interval IN ('month', 'year', 'one_time')),
  is_active          boolean NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can manage subscription_plans"
  ON subscription_plans FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ========================
-- subscriber_subscriptions（有料サブスク購読状況）
-- ========================
CREATE TABLE subscriber_subscriptions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscriber_id         uuid NOT NULL REFERENCES subscribers(id) ON DELETE CASCADE,
  plan_id               uuid NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id text UNIQUE,
  stripe_customer_id    text,
  status                text NOT NULL CHECK (status IN ('active','past_due','cancelled','trialing')),
  current_period_start  timestamptz,
  current_period_end    timestamptz,
  cancelled_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE subscriber_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members can view subscriptions"
  ON subscriber_subscriptions FOR SELECT
  USING (
    plan_id IN (
      SELECT sp.id FROM subscription_plans sp
      JOIN publications p ON p.id = sp.publication_id
      JOIN organization_members m ON m.organization_id = p.organization_id
      WHERE m.user_id = auth.uid()
      UNION
      SELECT sp.id FROM subscription_plans sp
      JOIN publications p ON p.id = sp.publication_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

CREATE POLICY "service role can manage subscriptions"
  ON subscriber_subscriptions FOR ALL
  WITH CHECK (true)
  USING (true);

CREATE INDEX idx_subscriber_subscriptions_subscriber ON subscriber_subscriptions(subscriber_id);
CREATE INDEX idx_subscriber_subscriptions_status ON subscriber_subscriptions(status);

-- ========================
-- api_keys
-- ========================
CREATE TABLE api_keys (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  publication_id  uuid NOT NULL REFERENCES publications(id) ON DELETE CASCADE,
  name            text NOT NULL,
  key_hash        text NOT NULL UNIQUE,
  key_prefix      text NOT NULL,
  last_used_at    timestamptz,
  created_by      uuid REFERENCES auth.users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org owner can manage api_keys"
  ON api_keys FOR ALL
  USING (
    publication_id IN (
      SELECT p.id FROM publications p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = auth.uid()
    )
  );

-- ========================
-- Helper: updated_at trigger
-- ========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_publications_updated_at
  BEFORE UPDATE ON publications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscribers_updated_at
  BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_forms_updated_at
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_subscriber_subscriptions_updated_at
  BEFORE UPDATE ON subscriber_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
