-- 修正：先删旧策略再建新的
DROP POLICY IF EXISTS "公开读取_photos" ON storage.objects;
DROP POLICY IF EXISTS "登录可上传_photos" ON storage.objects;
DROP POLICY IF EXISTS "登录可删除_photos" ON storage.objects;

-- 允许任何人读取
CREATE POLICY "公开读取_photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

-- 允许登录用户上传
CREATE POLICY "登录可上传_photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'photos');

-- 允许登录用户删除
CREATE POLICY "登录可删除_photos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'photos');
