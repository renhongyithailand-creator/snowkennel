-- ============================================
-- 升级：添加更多可编辑字段
-- 在 Supabase SQL Editor 中运行
-- ============================================

-- 扩展 site_config 表，添加所有页面文字字段
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS hero_tag TEXT NOT NULL DEFAULT 'Giant Schnauzer · 专业繁育';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS hero_desc TEXT NOT NULL DEFAULT '致力于繁育<strong>体型优美、性格稳定</strong>的巨型雪纳瑞<br>每一只幼犬，都是我们用心呵护的家人';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS about_heading TEXT NOT NULL DEFAULT '以爱之名，繁育品质';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS about_text TEXT NOT NULL DEFAULT '思糯犬舍坐落于环境优美的郊外，拥有宽敞的活动空间和专业的犬舍设施。我们专注巨型雪纳瑞单一犬种的繁育与养护，坚持科学喂养、健康优先的理念。\n\n每一只种犬均经过严格的健康筛查和性格评估，确保后代不仅拥有标准优美的体型结构，更具备稳定亲人的性格特质。\n\n多年来，我们坚持以最高的动物福利标准对待每一只犬只。';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS about_footer TEXT NOT NULL DEFAULT 'Breeding with love, raising with care';

-- 各区块的标题文字
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS about_label_en TEXT NOT NULL DEFAULT 'About Us';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS about_label_cn TEXT NOT NULL DEFAULT '关于思糯';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS about_subtitle_en TEXT NOT NULL DEFAULT 'Our Story';

ALTER TABLE site_config ADD COLUMN IF NOT EXISTS breed_label_en TEXT NOT NULL DEFAULT 'Breed Introduction';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS breed_label_cn TEXT NOT NULL DEFAULT '巨型雪纳瑞';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS breed_subtitle_en TEXT NOT NULL DEFAULT 'The Giant Schnauzer';

ALTER TABLE site_config ADD COLUMN IF NOT EXISTS dogs_label_en TEXT NOT NULL DEFAULT 'Our Dogs';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS dogs_label_cn TEXT NOT NULL DEFAULT '种犬展示';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS dogs_subtitle_en TEXT NOT NULL DEFAULT 'Stud Dogs & Dams';

ALTER TABLE site_config ADD COLUMN IF NOT EXISTS gallery_label_en TEXT NOT NULL DEFAULT 'Gallery';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS gallery_label_cn TEXT NOT NULL DEFAULT '犬舍风采';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS gallery_subtitle_en TEXT NOT NULL DEFAULT 'Our Life & Puppies';

ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_label_en TEXT NOT NULL DEFAULT 'Contact';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_label_cn TEXT NOT NULL DEFAULT '联系我们';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_subtitle_en TEXT NOT NULL DEFAULT 'Get In Touch';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_heading TEXT NOT NULL DEFAULT '欢迎预约来访';
ALTER TABLE site_config ADD COLUMN IF NOT EXISTS contact_qr_hint TEXT NOT NULL DEFAULT '扫码添加微信，了解更多犬只信息';

ALTER TABLE site_config ADD COLUMN IF NOT EXISTS footer_text TEXT NOT NULL DEFAULT '© 2026 思糯犬舍 SNOW KENNEL — 巨型雪纳瑞专业繁育';

-- ============================================
-- 犬种特性表（可编辑卡片）
-- ============================================
CREATE TABLE IF NOT EXISTS breed_traits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  icon TEXT NOT NULL DEFAULT '🐕',
  title TEXT NOT NULL DEFAULT '',
  en_label TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE breed_traits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "公开读取_traits" ON breed_traits FOR SELECT USING (true);
CREATE POLICY "登录可修改_traits" ON breed_traits FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- 插入默认数据
DELETE FROM breed_traits;
INSERT INTO breed_traits (icon, title, en_label, description, sort_order) VALUES
('🛡️', '忠诚护卫', 'Loyal Guardian', '天生具有护卫本能，对家人极度忠诚。警觉勇敢却不具攻击性，是理想的工作犬与家庭伴侣犬。', 1),
('🧠', '聪明机敏', 'Highly Intelligent', '犬类智商排名前列，学习能力强，服从性好。需要适量的脑力刺激和训练来保持身心平衡。', 2),
('⚡', '活力充沛', 'Energetic & Robust', '体格强壮、耐力出众，适合活跃的家庭。每日充足运动能让它们保持愉悦和健康的体态。', 3);
