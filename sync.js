#!/usr/bin/env node
// 思糯犬舍 — 数据同步脚本
// 用法: node sync.js   （从 Supabase 拉取数据更新 index.html 的 SITE_DATA）
const https = require('https')

const API = 'https://myzvmmrexkzhasotpjjo.supabase.co/rest/v1'
const KEY = 'sb_publishable_nLb9ULPNjSd-nor6JDlTKA_AGAlSFWY'

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { apikey: KEY, Authorization: 'Bearer ' + KEY } }, res => {
      let data = ''
      res.on('data', c => data += c)
      res.on('end', () => { try { resolve(JSON.parse(data)) } catch(e) { resolve(null) } })
    }).on('error', () => resolve(null))
  })
}

async function sync() {
  console.log('📡 从 Supabase 拉取数据...')
  const [dogs, gallery, contacts, config, traits] = await Promise.allSettled([
    fetchJSON(API + '/dogs?select=*&order=sort_order'),
    fetchJSON(API + '/gallery?select=*&order=sort_order'),
    fetchJSON(API + '/contacts?select=*&limit=1'),
    fetchJSON(API + '/site_config?select=*&limit=1'),
    fetchJSON(API + '/breed_traits?select=*&order=sort_order')
  ])
  const v = r => r.status === 'fulfilled' ? r.value : null
  const dgs = v(dogs) || [], gal = v(gallery) || [], trt = v(traits) || []
  const ctc = (v(contacts) && v(contacts)[0]) || {}, cfg = (v(config) && v(config)[0]) || {}

  // 生成 SITE_DATA
  let lines = []
  lines.push('  heroPhoto: ' + JSON.stringify(cfg.hero_photo || 'logo.jpg') + ',')
  lines.push('')
  // traits
  lines.push('  traits: [')
  trt.forEach((t, i) => {
    lines.push('    { icon: ' + JSON.stringify(t.icon) + ', title: ' + JSON.stringify(t.title) + ', en: ' + JSON.stringify(t.en_label) + ', desc: ' + JSON.stringify(t.description) + ' }' + (i < trt.length - 1 ? ',' : ''))
  })
  lines.push('  ],')
  lines.push('')
  // dogs
  lines.push('  dogs: [')
  dgs.forEach((d, i) => {
    lines.push('    {')
    lines.push('      name: ' + JSON.stringify(d.name) + ',')
    lines.push('      en: ' + JSON.stringify(d.name_en) + ',')
    lines.push('      title: ' + JSON.stringify(d.title) + ',')
    lines.push('      desc: ' + JSON.stringify(d.description) + ',')
    lines.push('      photo: ' + JSON.stringify(d.photo) + ',')
    lines.push('      stats: [')
    lines.push('        { val: ' + JSON.stringify(d.height) + ', label: \'肩高\' },')
    lines.push('        { val: ' + JSON.stringify(d.weight) + ', label: \'体重\' },')
    lines.push('        { val: ' + JSON.stringify(d.genetics) + ', label: \'遗传\' }')
    lines.push('      ]')
    lines.push('    }' + (i < dgs.length - 1 ? ',' : ''))
  })
  lines.push('  ],')
  lines.push('')
  // gallery
  lines.push('  gallery: [')
  gal.forEach((g, i) => {
    lines.push('    { label: ' + JSON.stringify(g.label) + ', layout: ' + JSON.stringify(g.layout) + ', photo: ' + JSON.stringify(g.photo) + ' }' + (i < gal.length - 1 ? ',' : ''))
  })
  lines.push('  ],')
  lines.push('')
  // contact
  lines.push('  contact: {')
  lines.push('    title: ' + JSON.stringify(cfg.contact_heading || '欢迎预约来访') + ',')
  lines.push('    items: [')
  lines.push('      { icon: \'📍\', label: \'犬舍地址\',  value: ' + JSON.stringify(ctc.address || '') + ' },')
  lines.push('      { icon: \'📞\', label: \'联系电话\',  value: ' + JSON.stringify(ctc.phone || '') + ' },')
  lines.push('      { icon: \'✉️\', label: \'电子邮箱\',  value: ' + JSON.stringify(ctc.email || '') + ' },')
  lines.push('      { icon: \'💬\', label: \'微信咨询\',  value: ' + JSON.stringify(ctc.wechat || '') + ' }')
  lines.push('    ],')
  lines.push('    qrPhoto: ' + JSON.stringify(ctc.qr_photo || '') + ',')
  lines.push('    qrHint: ' + JSON.stringify(cfg.contact_qr_hint || '扫码添加微信') + '')
  lines.push('  }')

  const newData = lines.join('\n')

  // 读取 index.html
  const fs = require('fs')
  let html = fs.readFileSync('index.html', 'utf8')

  // 查找并替换 SITE_DATA 内容
  const start = html.indexOf('var SITE_DATA = {')
  const end = html.indexOf(';\n// ═══════════', start)
  if (start === -1 || end === -1) { console.log('❌ 未找到 SITE_DATA，请确认 index.html 格式'); process.exit(1) }

  html = html.substring(0, start + 18) + '\n' + newData + '\n' + html.substring(end)

  fs.writeFileSync('index.html', html)
  console.log('✅ index.html 已更新')
}

sync()
