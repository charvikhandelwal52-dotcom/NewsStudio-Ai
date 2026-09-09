-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');
CREATE TYPE public.post_status AS ENUM ('draft', 'in_review', 'approved', 'scheduled', 'published', 'rejected');
CREATE TYPE public.approval_decision AS ENUM ('approved', 'changes_requested', 'rejected');
CREATE TYPE public.news_item_status AS ENUM ('new', 'triaged', 'dismissed');
CREATE TYPE public.source_type AS ENUM ('rss', 'website', 'api', 'newsletter');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'New member',
  avatar_url TEXT,
  job_title TEXT NOT NULL DEFAULT 'Editor',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  notify_approvals BOOLEAN NOT NULL DEFAULT true,
  notify_publishing BOOLEAN NOT NULL DEFAULT true,
  notify_digest BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- USER ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "roles_read_all" ON public.user_roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_admin_write" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE existing_count INT;
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'full_name', split_part(NEW.email, '@', 1), 'New member'),
    NEW.raw_user_meta_data ->> 'avatar_url'
  ) ON CONFLICT (id) DO NOTHING;

  SELECT count(*) INTO existing_count FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN existing_count = 0 THEN 'admin'::public.app_role ELSE 'editor'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- SOURCES
CREATE TABLE public.sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type public.source_type NOT NULL DEFAULT 'rss',
  topics TEXT[] NOT NULL DEFAULT '{}',
  fetch_frequency_minutes INT NOT NULL DEFAULT 60,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_checked_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sources TO authenticated;
GRANT ALL ON public.sources TO service_role;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_read" ON public.sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "sources_admin_write" ON public.sources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER sources_updated_at BEFORE UPDATE ON public.sources FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- NEWS ITEMS
CREATE TABLE public.news_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES public.sources(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  url TEXT,
  image_url TEXT,
  topic TEXT NOT NULL DEFAULT 'General',
  status public.news_item_status NOT NULL DEFAULT 'new',
  is_read BOOLEAN NOT NULL DEFAULT false,
  relevance_score INT NOT NULL DEFAULT 50,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_items TO authenticated;
GRANT ALL ON public.news_items TO service_role;
ALTER TABLE public.news_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news_read" ON public.news_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "news_write" ON public.news_items FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "news_update" ON public.news_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "news_delete_admin" ON public.news_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER news_items_updated_at BEFORE UPDATE ON public.news_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONTENT POSTS
CREATE TABLE public.content_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  news_item_id UUID REFERENCES public.news_items(id) ON DELETE SET NULL,
  headline TEXT NOT NULL DEFAULT 'Untitled draft',
  body TEXT NOT NULL DEFAULT '',
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  topics TEXT[] NOT NULL DEFAULT '{}',
  image_url TEXT,
  channel TEXT NOT NULL DEFAULT 'instagram',
  format TEXT NOT NULL DEFAULT 'post',
  status public.post_status NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_label TEXT NOT NULL DEFAULT 'Newsroom',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_posts TO authenticated;
GRANT ALL ON public.content_posts TO service_role;
ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_read" ON public.content_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "posts_insert" ON public.content_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "posts_update" ON public.content_posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "posts_delete" ON public.content_posts FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR author_id = auth.uid());
CREATE TRIGGER content_posts_updated_at BEFORE UPDATE ON public.content_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- APPROVALS
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.content_posts(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label TEXT NOT NULL DEFAULT 'Team member',
  decision public.approval_decision NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approvals_read" ON public.approvals FOR SELECT TO authenticated USING (true);
CREATE POLICY "approvals_insert" ON public.approvals FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
CREATE INDEX approvals_post_idx ON public.approvals(post_id, created_at DESC);

-- ANALYTICS
CREATE TABLE public.analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.content_posts(id) ON DELETE CASCADE,
  reach INT NOT NULL DEFAULT 0,
  likes INT NOT NULL DEFAULT 0,
  comments INT NOT NULL DEFAULT 0,
  saves INT NOT NULL DEFAULT 0,
  shares INT NOT NULL DEFAULT 0,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analytics_snapshots TO authenticated;
GRANT ALL ON public.analytics_snapshots TO service_role;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics_read" ON public.analytics_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "analytics_admin_write" ON public.analytics_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ SAMPLE NEWSROOM DATA (loaded before the approval gate is armed) ============
INSERT INTO public.sources (id, name, url, type, topics, fetch_frequency_minutes, enabled, last_checked_at) VALUES
 ('11111111-1111-4111-8111-000000000001','Reuters World','https://www.reuters.com/world/','rss', ARRAY['World','Politics'], 30, true, now() - interval '22 minutes'),
 ('11111111-1111-4111-8111-000000000002','TechCrunch','https://techcrunch.com/feed/','rss', ARRAY['Technology','Startups'], 60, true, now() - interval '1 hour'),
 ('11111111-1111-4111-8111-000000000003','The Verge Science','https://www.theverge.com/science','website', ARRAY['Science','Technology'], 120, true, now() - interval '3 hours'),
 ('11111111-1111-4111-8111-000000000004','ESPN Cricinfo','https://www.espncricinfo.com/','api', ARRAY['Sports'], 15, true, now() - interval '9 minutes'),
 ('11111111-1111-4111-8111-000000000005','Morning Brew','https://www.morningbrew.com/','newsletter', ARRAY['Business','Finance'], 1440, false, now() - interval '2 days');

INSERT INTO public.news_items (id, source_id, title, summary, url, topic, status, is_read, relevance_score, published_at) VALUES
 ('22222222-2222-4222-8222-000000000001','11111111-1111-4111-8111-000000000002','Chip maker unveils on-device model that runs offline','A new compact model claims desktop-class reasoning on a phone without a network connection, reshaping the assistant market.','https://techcrunch.com/','Technology','new',false,92, now() - interval '40 minutes'),
 ('22222222-2222-4222-8222-000000000002','11111111-1111-4111-8111-000000000001','Central banks signal coordinated pause on rate hikes','Officials from four major economies hinted at holding rates steady through the next quarter as inflation cools.','https://www.reuters.com/','Business','new',false,78, now() - interval '2 hours'),
 ('22222222-2222-4222-8222-000000000003','11111111-1111-4111-8111-000000000004','Last-over thriller decides the series in Chennai','A six off the final ball sealed a two-wicket win in front of a record home crowd.','https://www.espncricinfo.com/','Sports','triaged',true,84, now() - interval '5 hours'),
 ('22222222-2222-4222-8222-000000000004','11111111-1111-4111-8111-000000000003','Ocean drone maps a previously unknown deep-sea ridge','Researchers say the 400km formation could host undocumented species.','https://www.theverge.com/','Science','new',true,66, now() - interval '9 hours'),
 ('22222222-2222-4222-8222-000000000005','11111111-1111-4111-8111-000000000001','Election commission publishes new campaign spending rules','Parties must now disclose digital ad spend within 48 hours.','https://www.reuters.com/','Politics','new',false,71, now() - interval '14 hours'),
 ('22222222-2222-4222-8222-000000000006','11111111-1111-4111-8111-000000000002','Two founders raise seed round for climate logistics startup','The company routes freight around high-emission corridors.','https://techcrunch.com/','Startups','dismissed',true,38, now() - interval '1 day'),
 ('22222222-2222-4222-8222-000000000007','11111111-1111-4111-8111-000000000003','Fusion test reactor holds plasma for a record 22 minutes','The run more than doubles the previous benchmark for sustained confinement.','https://www.theverge.com/','Science','triaged',true,88, now() - interval '1 day 4 hours'),
 ('22222222-2222-4222-8222-000000000008','11111111-1111-4111-8111-000000000004','City club signs teenage striker in record domestic transfer','The 19-year-old joins on a five-year deal after a breakout season.','https://www.espncricinfo.com/','Sports','new',false,59, now() - interval '2 days');

INSERT INTO public.content_posts (id, news_item_id, headline, body, hashtags, topics, channel, format, status, scheduled_at, published_at, author_label, created_at) VALUES
 ('33333333-3333-4333-8333-000000000001','22222222-2222-4222-8222-000000000001','Your phone just got a brain that works offline','A new compact model runs desktop-class reasoning entirely on-device — no signal, no cloud, no data leaving your pocket. Here is why that changes the assistant race.', ARRAY['#AI','#Tech','#OnDevice'], ARRAY['Technology'],'instagram','post','draft',NULL,NULL,'Newsroom', now() - interval '35 minutes'),
 ('33333333-3333-4333-8333-000000000002','22222222-2222-4222-8222-000000000003','Six off the final ball. Series over.','Chennai got the ending it wanted: two wickets in hand, six runs needed, and one swing that emptied the stands into the aisles.', ARRAY['#Cricket','#Sports','#LastBall'], ARRAY['Sports'],'instagram','reel','in_review',NULL,NULL,'Newsroom', now() - interval '4 hours'),
 ('33333333-3333-4333-8333-000000000003','22222222-2222-4222-8222-000000000007','22 minutes of contained star','A fusion test reactor held plasma for 22 minutes — more than double the old record. Still not a power plant, but a very loud step.', ARRAY['#Science','#Fusion','#Energy'], ARRAY['Science'],'instagram','post','in_review',NULL,NULL,'Newsroom', now() - interval '1 day 2 hours'),
 ('33333333-3333-4333-8333-000000000004','22222222-2222-4222-8222-000000000002','Rate hikes are on pause. Here is what it means for you.','Four major central banks signalled a hold through next quarter. Mortgages, savings rates and hiring all move on this.', ARRAY['#Business','#Economy','#Finance'], ARRAY['Business'],'instagram','carousel','approved',NULL,NULL,'Newsroom', now() - interval '1 day'),
 ('33333333-3333-4333-8333-000000000005','22222222-2222-4222-8222-000000000005','New campaign spending rules, explained in 60 seconds','Digital ad spend must now be disclosed within 48 hours. Here is what parties have to publish, and when.', ARRAY['#Politics','#Elections'], ARRAY['Politics'],'instagram','post','scheduled', now() + interval '1 day 3 hours', NULL,'Newsroom', now() - interval '2 days'),
 ('33333333-3333-4333-8333-000000000006','22222222-2222-4222-8222-000000000004','A 400km ridge nobody knew was there','An ocean drone mapped a deep-sea formation longer than most mountain ranges. Researchers think it hosts species we have never catalogued.', ARRAY['#Science','#Ocean'], ARRAY['Science'],'instagram','reel','scheduled', now() + interval '3 days', NULL,'Newsroom', now() - interval '2 days 4 hours'),
 ('33333333-3333-4333-8333-000000000007','22222222-2222-4222-8222-000000000008','Record transfer, teenage striker, five-year deal','A 19-year-old just became the most expensive domestic signing in the league''s history.', ARRAY['#Sports','#Transfer'], ARRAY['Sports'],'instagram','post','published', now() - interval '3 days', now() - interval '3 days','Newsroom', now() - interval '4 days'),
 ('33333333-3333-4333-8333-000000000008','22222222-2222-4222-8222-000000000006','The startup routing freight around dirty corridors','Seed round closed. The pitch: every shipment picks the lowest-emission path automatically.', ARRAY['#Climate','#Startups'], ARRAY['Startups'],'instagram','post','published', now() - interval '6 days', now() - interval '6 days','Newsroom', now() - interval '7 days'),
 ('33333333-3333-4333-8333-000000000009',NULL,'Weekly recap: five stories that actually mattered','A short scroll through the week — rates, fusion, one very good last ball, and two things you probably missed.', ARRAY['#Recap','#Weekly'], ARRAY['General'],'instagram','carousel','published', now() - interval '9 days', now() - interval '9 days','Newsroom', now() - interval '10 days'),
 ('33333333-3333-4333-8333-000000000010',NULL,'Draft: monsoon coverage plan','Placeholder outline for the monsoon series. Needs a hook and a lead image before review.', ARRAY['#Weather'], ARRAY['General'],'instagram','post','rejected',NULL,NULL,'Newsroom', now() - interval '5 days');

INSERT INTO public.approvals (post_id, actor_label, decision, comment, created_at) VALUES
 ('33333333-3333-4333-8333-000000000004','Priya Nair','approved','Numbers check out against the wire copy. Good to schedule.', now() - interval '20 hours'),
 ('33333333-3333-4333-8333-000000000005','Priya Nair','changes_requested','Tighten the opening line and add the effective date.', now() - interval '1 day 20 hours'),
 ('33333333-3333-4333-8333-000000000005','Arjun Mehta','approved','Reads well now. Approved for the Thursday slot.', now() - interval '1 day 6 hours'),
 ('33333333-3333-4333-8333-000000000006','Arjun Mehta','approved','Source confirmed with the research team.', now() - interval '2 days'),
 ('33333333-3333-4333-8333-000000000007','Priya Nair','approved','Transfer fee verified. Ship it.', now() - interval '3 days 2 hours'),
 ('33333333-3333-4333-8333-000000000008','Arjun Mehta','approved','Founder quotes cleared.', now() - interval '6 days 3 hours'),
 ('33333333-3333-4333-8333-000000000009','Priya Nair','approved','Standard weekly recap, approved.', now() - interval '9 days 2 hours'),
 ('33333333-3333-4333-8333-000000000010','Priya Nair','rejected','Not enough here yet — no hook, no imagery. Rework from scratch.', now() - interval '4 days');

INSERT INTO public.analytics_snapshots (post_id, reach, likes, comments, saves, shares, captured_at) VALUES
 ('33333333-3333-4333-8333-000000000007', 48210, 5120, 288, 640, 410, now() - interval '2 days'),
 ('33333333-3333-4333-8333-000000000008', 21740, 1880, 96, 310, 145, now() - interval '5 days'),
 ('33333333-3333-4333-8333-000000000009', 33960, 3410, 174, 522, 268, now() - interval '8 days');

-- HUMAN APPROVAL GATE (armed after seeding)
CREATE OR REPLACE FUNCTION public.enforce_human_approval()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('scheduled', 'published') THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.approvals a
      WHERE a.post_id = NEW.id AND a.decision = 'approved'
        AND a.created_at >= COALESCE((
          SELECT max(b.created_at) FROM public.approvals b
          WHERE b.post_id = NEW.id AND b.decision <> 'approved'
        ), '-infinity'::timestamptz)
    ) THEN
      RAISE EXCEPTION 'This post must be approved by a person before it can be scheduled or published.';
    END IF;
  END IF;
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER content_posts_approval_gate
BEFORE INSERT OR UPDATE OF status ON public.content_posts
FOR EACH ROW EXECUTE FUNCTION public.enforce_human_approval();