const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(
  'https://myzvmmrexkzhasotpjjo.supabase.co',
  'sb_publishable_nLb9ULPNjSd-nor6JDlTKA_AGAlSFWY'
)

async function build() {
  console.log('📡 拉取数据...')
  const [dogs, gallery, contacts, config, traits] = await Promise.all([
    sb.from('dogs').select('*').order('sort_order'),
    sb.from('gallery').select('*').order('sort_order'),
    sb.from('contacts').select('*').limit(1).single(),
    sb.from('site_config').select('*').limit(1).single(),
    sb.from('breed_traits').select('*').order('sort_order')
  ])

  const d = dogs.data || [], g = gallery.data || [], t = traits.data || []
  const c = contacts.data || {}, cf = config.data || {}

  // 构造新 SITE_DATA
  const siteData = {
    heroPhoto: cf.hero_photo || 'logo.jpg',
    traits: t.map(x => ({ icon: x.icon, title: x.title, en: x.en_label, desc: x.description })),
    dogs: d.map(x => ({
      name: x.name, en: x.name_en, title: x.title, desc: x.description, photo: x.photo,
      stats: [
        { val: x.height, label: '肩高' },
        { val: x.weight, label: '体重' },
        { val: x.genetics, label: '遗传' }
      ]
    })),
    gallery: g.map(x => ({ label: x.label, layout: x.layout, photo: x.photo })),
    contact: {
      title: cf.contact_heading || '欢迎预约来访',
      items: [
        { icon: '📍', label: '犬舍地址', value: c.address || '' },
        { icon: '📞', label: '联系电话', value: c.phone || '' },
        { icon: '✉️', label: '电子邮箱', value: c.email || '' },
        { icon: '💬', label: '微信咨询', value: c.wechat || '' }
      ],
      qrPhoto: c.qr_photo || '',
      qrHint: cf.contact_qr_hint || '扫码添加微信，了解更多犬只信息'
    }
  }

  // 序列化为 JS（双引号 JSON 可直接嵌入代码）
  const jsStr = JSON.stringify(siteData, null, 2)
    .replace(/"([^"]+)":/g, '$1:')           // 去掉 key 的引号
    .replace(/: "([^"]*)"/g, ": '$1'")       // 值用单引号
    .replace(/^\{/m, '  ')                    // 第一行缩进
    .replace(/\}$/m, '')                      // 去掉最后的花括号

  // 包裹成 SITE_DATA
  const newData = '  heroPhoto: \'' + siteData.heroPhoto + '\',\n' +
    jsStr.substring(jsStr.indexOf('  traits:'))

  // 替换 index.html
  let html = fs.readFileSync('index.html', 'utf8')
  const start = html.indexOf('var SITE_DATA = {')
  const endMarker = html.indexOf('数据配置结束')
  const end = html.lastIndexOf(';', endMarker)

  if (start === -1 || end === -1) { console.error('❌ 未找到 SITE_DATA'); process.exit(1) }

  html = html.substring(0, start + 18) + '\n' + newData + '\n' + html.substring(end)
  fs.writeFileSync('index.html', html)
  console.log('✅ 完成 种犬:' + d.length + ' 照片:' + g.length + ' 特性:' + t.length)
  console.log('👉 运行 git add -A && git commit -m "更新" && git push')
}

build().catch(e => { console.error('❌', e.message); process.exit(1) })
