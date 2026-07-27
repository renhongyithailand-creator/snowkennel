-- ============================================
-- 思糯犬舍 SNOW KENNEL — 数据库初始化
-- 在 Supabase SQL Editor 中运行
-- ============================================

-- 种犬表
CREATE TABLE dogs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  name_en TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  type TEXT NOT NULL DEFAULT '种公',  -- 种公 or 种母
  height TEXT NOT NULL DEFAULT '',
  weight TEXT NOT NULL DEFAULT '',
  genetics TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 联系方式表（只存一行）
CREATE TABLE contacts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  address TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  wechat TEXT NOT NULL DEFAULT '',
  qr_photo TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 照片墙表
CREATE TABLE gallery (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label TEXT NOT NULL DEFAULT '',
  photo TEXT NOT NULL DEFAULT '',
  layout TEXT NOT NULL DEFAULT '',  -- tall, wide, 或空
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 网站设置表（只存一行）
CREATE TABLE site_config (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  hero_photo TEXT NOT NULL DEFAULT '',
  about_photo TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 插入初始数据（和当前 SITE_DATA 一致）
-- ============================================

INSERT INTO dogs (name, name_en, title, description, type, height, weight, genetics, sort_order) VALUES
('种公 · 名称待定', 'Champion Line', '中国永久冠军登录 · CH.CN', '体格雄伟，头版标准，被毛刚硬浓密。性格沉稳自信，遗传稳定，后代品质优异。', '种公', '68cm', '47kg', 'A/A', 1),
('种母 · 名称待定', 'European Bloodline', '欧洲冠军血系 · INT.CH', '结构匀称，动态流畅，母性极佳。性格温柔亲人，繁育的后代性格稳定、适应力强。', '种母', '62cm', '38kg', 'A/B', 2);

INSERT INTO contacts (address, phone, email, wechat) VALUES
('（请填写您的犬舍地址）', '（请填写您的联系电话）', 'info@snowkennel.com', '（请填写您的微信号）');

INSERT INTO gallery (label, layout, sort_order) VALUES
('犬舍环境', 'tall', 1),
('幼犬日常', '', 2),
('户外活动', 'wide', 3),
('训练时光', '', 4),
('赛场风采', 'wide', 5),
('温馨时刻', 'tall', 6);

INSERT INTO site_config (hero_photo) VALUES ('logo.jpg');

-- ============================================
-- 开启公开读取（展示页不需要登录就能读）
-- ============================================

-- 允许匿名用户读取
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "公开读取_dogs" ON dogs FOR SELECT USING (true);
CREATE POLICY "公开读取_contacts" ON contacts FOR SELECT USING (true);
CREATE POLICY "公开读取_gallery" ON gallery FOR SELECT USING (true);
CREATE POLICY "公开读取_site_config" ON site_config FOR SELECT USING (true);

-- 只有登录用户可以修改
CREATE POLICY "登录可修改_dogs" ON dogs FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "登录可修改_contacts" ON contacts FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "登录可修改_gallery" ON gallery FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "登录可修改_site_config" ON site_config FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
