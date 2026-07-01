-- ===================================================
-- Seed: リアルなニュースレターデータ
-- ===================================================
-- NOTE: auth.users への直接 INSERT は Supabase Dashboard で作成後に UUID を置き換えてください
-- このシードは開発・デモ用です

-- Demo organization
INSERT INTO organizations (id, owner_id, name, slug, plan) VALUES
  ('11111111-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'TechInsider Japan', 'techinsider-japan', 'pro')
ON CONFLICT DO NOTHING;

-- Demo publication
INSERT INTO publications (id, organization_id, name, slug, description, settings) VALUES
  ('22222222-0000-0000-0000-000000000001', '11111111-0000-0000-0000-000000000001',
   'TechInsider Weekly', 'techinsider-weekly',
   'テクノロジー業界の最新トレンドと深掘り分析。毎週水曜配信。',
   '{"from_name": "田中 誠（TechInsider）", "from_email": "hello@techinsider.jp", "reply_to": "reply@techinsider.jp"}'::jsonb)
ON CONFLICT DO NOTHING;

-- Tags
INSERT INTO tags (id, publication_id, name, color) VALUES
  ('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'AI・機械学習', '#7c3aed'),
  ('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'スタートアップ', '#0891b2'),
  ('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', '有料会員', '#16a34a'),
  ('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'エンジニア', '#dc2626'),
  ('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'プロダクトマネージャー', '#ea580c')
ON CONFLICT DO NOTHING;

-- Subscribers（実在っぽい名前・企業）
INSERT INTO subscribers (id, publication_id, email, first_name, last_name, status, source, utm_source, utm_campaign, subscribed_at) VALUES
  ('44444444-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'yamamoto.kenji@mercari.example.com', '健二', '山本', 'active', 'form:homepage', 'twitter', 'ai-article-jun2025', now() - interval '90 days'),
  ('44444444-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'sato.ayako@freee.example.com', '彩子', '佐藤', 'active', 'form:homepage', 'note', NULL, now() - interval '75 days'),
  ('44444444-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001', 'tanaka.hiroshi@cyberagent.example.com', '浩', '田中', 'active', 'import', NULL, NULL, now() - interval '60 days'),
  ('44444444-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000001', 'ito.mizuki@smarthr.example.com', '瑞希', '伊藤', 'active', 'form:homepage', 'linkedin', 'product-series', now() - interval '45 days'),
  ('44444444-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000001', 'nakamura.takashi@moneyforward.example.com', '隆', '中村', 'active', 'api', 'twitter', NULL, now() - interval '30 days'),
  ('44444444-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000001', 'suzuki.yuki@wantedly.example.com', '悠樹', '鈴木', 'active', 'form:homepage', 'google', 'seo-landing', now() - interval '20 days'),
  ('44444444-0000-0000-0000-000000000007', '22222222-0000-0000-0000-000000000001', 'kobayashi.nana@gmo.example.com', '奈々', '小林', 'active', 'manual', NULL, NULL, now() - interval '15 days'),
  ('44444444-0000-0000-0000-000000000008', '22222222-0000-0000-0000-000000000001', 'kato.ryo@uipath.example.com', '遼', '加藤', 'active', 'form:homepage', 'email', 'refer-friend', now() - interval '10 days'),
  ('44444444-0000-0000-0000-000000000009', '22222222-0000-0000-0000-000000000001', 'watanabe.haruka@sansan.example.com', '春香', '渡辺', 'unsubscribed', 'form:homepage', 'google', NULL, now() - interval '50 days'),
  ('44444444-0000-0000-0000-000000000010', '22222222-0000-0000-0000-000000000001', 'yoshida.ken@chatwork.example.com', '賢', '吉田', 'bounced', 'import', NULL, NULL, now() - interval '40 days')
ON CONFLICT DO NOTHING;

-- Subscriber tags
INSERT INTO subscriber_tags (subscriber_id, tag_id) VALUES
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001'), -- 山本 → AI
  ('44444444-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000004'), -- 山本 → エンジニア
  ('44444444-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000005'), -- 佐藤 → PM
  ('44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000001'), -- 田中 → AI
  ('44444444-0000-0000-0000-000000000003', '33333333-0000-0000-0000-000000000002'), -- 田中 → スタートアップ
  ('44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000003'), -- 伊藤 → 有料会員
  ('44444444-0000-0000-0000-000000000004', '33333333-0000-0000-0000-000000000005'), -- 伊藤 → PM
  ('44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000002'), -- 中村 → スタートアップ
  ('44444444-0000-0000-0000-000000000005', '33333333-0000-0000-0000-000000000003')  -- 中村 → 有料会員
ON CONFLICT DO NOTHING;

-- Campaigns
INSERT INTO campaigns (id, publication_id, subject, preview_text, content_json, content_html, status, sent_at, stats) VALUES
  ('55555555-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   'Claude 4.6 vs GPT-5: 実務で差がつく5つのポイント',
   '先週のモデル比較を実際に業務で試してみた結果...',
   '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"今週のハイライト"}]},{"type":"paragraph","content":[{"type":"text","text":"Anthropicが発表したClaude 4.6は、コード生成とマルチステップ推論で前モデル比40%の性能向上を達成。実際に3週間使い込んだ結果を報告します。"}]}]}'::jsonb,
   '<h2>今週のハイライト</h2><p>Anthropicが発表したClaude 4.6は、コード生成とマルチステップ推論で前モデル比40%の性能向上を達成。</p>',
   'sent',
   now() - interval '7 days',
   '{"sent":8,"delivered":7,"opens":5,"clicks":3,"unsubscribes":0,"bounces":1}'::jsonb),

  ('55555555-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
   '日本のスタートアップが今注目すべき3つのAIインフラ戦略',
   'AWSかGCPか、それとも独自インフラか...',
   '{"type":"doc","content":[{"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"AIインフラの選択基準"}]},{"type":"paragraph","content":[{"type":"text","text":"月5万円のクラウド費用を抑えながら推論速度を落とさない方法。実例5社の選択を分析しました。"}]}]}'::jsonb,
   '<h2>AIインフラの選択基準</h2><p>月5万円のクラウド費用を抑えながら推論速度を落とさない方法。</p>',
   'sent',
   now() - interval '14 days',
   '{"sent":6,"delivered":6,"opens":4,"clicks":2,"unsubscribes":1,"bounces":0}'::jsonb),

  ('55555555-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000001',
   'プロダクト開発者向け：ユーザーインタビュー設計の失敗パターン',
   '「ユーザーに聞けばわかる」が最大の落とし穴',
   '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"下書き中..."}]}]}'::jsonb,
   NULL,
   'draft',
   NULL,
   '{"sent":0,"delivered":0,"opens":0,"clicks":0,"unsubscribes":0,"bounces":0}'::jsonb)
ON CONFLICT DO NOTHING;

-- Campaign events（開封・クリック）
INSERT INTO campaign_events (campaign_id, subscriber_id, event_type, url, occurred_at) VALUES
  -- キャンペーン1の開封・クリック
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'delivered', NULL, now() - interval '7 days'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'open', NULL, now() - interval '7 days' + interval '2 hours'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'click', 'https://techinsider.jp/claude46-review', now() - interval '7 days' + interval '2.5 hours'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'delivered', NULL, now() - interval '7 days'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000002', 'open', NULL, now() - interval '6 days'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'delivered', NULL, now() - interval '7 days'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'open', NULL, now() - interval '7 days' + interval '1 hour'),
  ('55555555-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000004', 'delivered', NULL, now() - interval '7 days'),
  -- キャンペーン2
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 'delivered', NULL, now() - interval '14 days'),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000001', 'open', NULL, now() - interval '14 days' + interval '3 hours'),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000002', 'delivered', NULL, now() - interval '14 days'),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000003', 'delivered', NULL, now() - interval '14 days'),
  ('55555555-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000003', 'open', NULL, now() - interval '13 days')
ON CONFLICT DO NOTHING;

-- Automations
INSERT INTO automations (id, publication_id, name, trigger_type, trigger_config, flow_json, status) VALUES
  ('66666666-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   '新規登録ウェルカムシーケンス',
   'subscriber_added',
   '{}'::jsonb,
   '{"nodes":[{"id":"trigger","type":"trigger","position":{"x":100,"y":100},"data":{"label":"登録トリガー","triggerType":"subscriber_added"}},{"id":"wait-1d","type":"wait","position":{"x":100,"y":220},"data":{"label":"1日待機","duration":1,"unit":"day"}},{"id":"email-welcome","type":"email","position":{"x":100,"y":340},"data":{"label":"ウェルカムメール送信","subject":"TechInsider Weeklyへようこそ！"}}],"edges":[{"id":"e1","source":"trigger","target":"wait-1d"},{"id":"e2","source":"wait-1d","target":"email-welcome"}]}'::jsonb,
   'active'),

  ('66666666-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
   'AI・機械学習タグ付与時フォローアップ',
   'tag_added',
   '{"tag_id": "33333333-0000-0000-0000-000000000001"}'::jsonb,
   '{"nodes":[{"id":"trigger","type":"trigger","position":{"x":100,"y":100},"data":{"label":"タグ追加トリガー","triggerType":"tag_added"}},{"id":"email-ai-intro","type":"email","position":{"x":100,"y":220},"data":{"label":"AIコンテンツ紹介メール"}}],"edges":[{"id":"e1","source":"trigger","target":"email-ai-intro"}]}'::jsonb,
   'draft')
ON CONFLICT DO NOTHING;

-- Forms
INSERT INTO forms (id, publication_id, name, type, config, total_views, total_signups) VALUES
  ('77777777-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001',
   'ホームページメインフォーム',
   'inline',
   '{"fields":[{"name":"email","type":"email","label":"メールアドレス","required":true,"placeholder":"you@example.com"},{"name":"first_name","type":"text","label":"お名前","required":false,"placeholder":"山田"}],"success_message":"登録完了！毎週水曜日にお届けします。","button_text":"無料で購読する","style":{"primary_color":"#1e293b","border_radius":"8px"}}'::jsonb,
   1240, 87),

  ('77777777-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001',
   '記事下ポップアップ',
   'popup',
   '{"fields":[{"name":"email","type":"email","label":"メールアドレス","required":true,"placeholder":"you@example.com"}],"success_message":"ありがとうございます！次号から配信されます。","button_text":"購読する","style":{"primary_color":"#1e293b","border_radius":"6px"},"trigger":{"type":"scroll","percentage":70}}'::jsonb,
   3820, 203)
ON CONFLICT DO NOTHING;
