-- 设置照片存储桶权限
-- 在 Supabase SQL Editor 中运行

-- 允许任何人读取
CREATE POLICY "公开读取_photos" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

-- 只有登录用户可以上传
CREATE POLICY "登录可上传_photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');

-- 只有登录用户可以删除
CREATE POLICY "登录可删除_photos" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
