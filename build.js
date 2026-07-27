const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const sb = createClient(
  'https://myzvmmrexkzhasotpjjo.supabase.co',
  'sb_publishable_nLb9ULPNjSd-nor6JDlTKA_AGAlSFWY'
)

// 安全序列化 JS 字符串值
function S(val) {
  return JSON.stringify(val || '')
}

// 生成 JS 对象字面量（缩进2空格）
function obj(props, indent) {
  var i = indent || '  '
  return '{\n' + props.map(function(p) { return i + p }).join(',\n') + '\n' + i.slice(0, -2) + '}'
}

async function build() {
  console.log('📡 拉取数据...')
  const [dogs, gallery, contacts, config, traits] = await Promise.all([
    sb.from('dogs').select('*').order('sort_order'),
    sb.from('gallery').select('*').order('sort_order'),
    sb.from('contacts').select('*').limit(1).single(),
    sb.from('site_config').select('*').limit(1).single(),
    sb.from('breed_traits').select('*').order('sort_order')
  ])

  const dgs = dogs.data || [], gal = gallery.data || [], trt = traits.data || []
  const ctc = contacts.data || {}, cfg = config.data || {}

  // 构造新的 SITE_DATA
  var lines = []
  lines.push('var SITE_DATA = {\n')
  lines.push('  heroPhoto: ' + S(cfg.hero_photo || 'logo.jpg') + ',\n')

  // traits
  lines.push('  traits: [\n')
  trt.forEach(function(t, i) {
    lines.push('    { icon: ' + S(t.icon) + ', title: ' + S(t.title) + ', en: ' + S(t.en_label) + ', desc: ' + S(t.description) + ' }')
    if (i < trt.length - 1) lines.push(',')
    lines.push('\n')
  })
  lines.push('  ],\n\n')

  // dogs
  lines.push('  dogs: [\n')
  dgs.forEach(function(d, i) {
    lines.push('    {\n')
    lines.push('      name: ' + S(d.name) + ',\n')
    lines.push('      en: ' + S(d.name_en) + ',\n')
    lines.push('      title: ' + S(d.title) + ',\n')
    lines.push('      desc: ' + S(d.description) + ',\n')
    lines.push('      photo: ' + S(d.photo) + ',\n')
    lines.push('      stats: [\n')
    lines.push('        { val: ' + S(d.height) + ', label: \'肩高\' },\n')
    lines.push('        { val: ' + S(d.weight) + ', label: \'体重\' },\n')
    lines.push('        { val: ' + S(d.genetics) + ', label: \'遗传\' }\n')
    lines.push('      ]\n')
    lines.push('    }')
    if (i < dgs.length - 1) lines.push(',')
    lines.push('\n')
  })
  lines.push('  ],\n\n')

  // gallery
  lines.push('  gallery: [\n')
  gal.forEach(function(g, i) {
    lines.push('    { label: ' + S(g.label) + ', layout: ' + S(g.layout) + ', photo: ' + S(g.photo) + ' }')
    if (i < gal.length - 1) lines.push(',')
    lines.push('\n')
  })
  lines.push('  ],\n\n')

  // contact
  lines.push('  contact: {\n')
  lines.push('    title: ' + S(cfg.contact_heading || '欢迎预约来访') + ',\n')
  lines.push('    items: [\n')
  lines.push('      { icon: \'📍\', label: \'犬舍地址\',  value: ' + S(ctc.address) + ' },\n')
  lines.push('      { icon: \'📞\', label: \'联系电话\',  value: ' + S(ctc.phone) + ' },\n')
  lines.push('      { icon: \'✉️\', label: \'电子邮箱\',  value: ' + S(ctc.email) + ' },\n')
  lines.push('      { icon: \'💬\', label: \'微信咨询\',  value: ' + S(ctc.wechat) + ' }\n')
  lines.push('    ],\n')
  lines.push('    qrPhoto: ' + S(ctc.qr_photo) + ',\n')
  lines.push('    qrHint: ' + S(cfg.contact_qr_hint || '扫码添加微信，了解更多犬只信息') + '\n')
  lines.push('  }\n')

  lines.push('};\n')

  var newData = lines.join('')

  // 替换 index.html 中的 SITE_DATA
  var html = fs.readFileSync('index.html', 'utf8')
  var start = html.indexOf('var SITE_DATA = {')
  var endMarker = html.indexOf('数据配置结束')
  var end = html.lastIndexOf(';', endMarker)

  if (start === -1 || end === -1) { console.error('❌ 未找到 SITE_DATA'); process.exit(1) }

  html = html.substring(0, start) + newData + '\n// ═══════════════ 数据配置结束 ═══════════════' + html.substring(endMarker + '数据配置结束'.length + ' ═══════════════'.length)

  fs.writeFileSync('index.html', html)
  console.log('✅ 完成 种犬:' + dgs.length + ' 照片:' + gal.length + ' 特性:' + trt.length)
  console.log('👉 npm run sync 一键同步+推送')
}

build().catch(function(e) { console.error('❌', e.message); process.exit(1) })
