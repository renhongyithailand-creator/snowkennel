/**
 * Decap CMS GitHub OAuth 代理 — Cloudflare Worker
 */
export default {
  async fetch(request, env) {
    var url = new URL(request.url)
    var path = url.pathname

    // 诊断：检查密钥是否设置
    if (path === '/test') {
      return new Response(
        'CLIENT_ID 已设置: ' + (env.GITHUB_CLIENT_ID ? '✅ (' + env.GITHUB_CLIENT_ID.substring(0, 8) + '...)' : '❌ 未设置') +
        '\nCLIENT_SECRET 已设置: ' + (env.GITHUB_CLIENT_SECRET ? '✅ (' + env.GITHUB_CLIENT_SECRET.substring(0, 4) + '...)' : '❌ 未设置'),
        { headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      )
    }

    // /auth — 跳转 GitHub 授权
    if (path === '/auth') {
      try {
        if (!env.GITHUB_CLIENT_ID) {
          return new Response('错误：GITHUB_CLIENT_ID 未设置', { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }
        var state = crypto.randomUUID()
        var authUrl = 'https://github.com/login/oauth/authorize' +
          '?client_id=' + encodeURIComponent(env.GITHUB_CLIENT_ID) +
          '&redirect_uri=' + encodeURIComponent(url.origin + '/callback') +
          '&scope=repo,user' +
          '&state=' + encodeURIComponent(state)
        return Response.redirect(authUrl, 302)
      } catch (e) {
        return new Response('/auth 错误: ' + e.message, { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    }

    // /callback — GitHub 回调
    if (path === '/callback') {
      try {
        var code = url.searchParams.get('code')
        if (!code) {
          return new Response(htmlPage('❌ 登录失败', '未收到授权码', '#d44'), { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 })
        }

        var tokenResp = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code
          })
        })

        var tokenData = await tokenResp.json()
        if (tokenData.error) {
          return new Response(htmlPage('❌ 登录失败', tokenData.error_description || tokenData.error, '#d44'), { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 400 })
        }

        var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>登录成功</title></head>' +
          '<body style="background:#1e1b18;color:#b8944c;font-family:sans-serif;text-align:center;padding-top:80px;">' +
          '<h2>✅ 登录成功</h2><p>窗口即将关闭…</p>' +
          '<script>' +
          '(function(){' +
          'window.opener.postMessage({token:"' + tokenData.access_token + '",provider:"github"},"*");' +
          'setTimeout(function(){window.close()},1500);' +
          '})();' +
          '</script></body></html>'
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

      } catch (e) {
        return new Response('/callback 错误: ' + e.message, { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    }

    return new Response('Snow Kennel OAuth Proxy ✅', { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
  }
}

function htmlPage(title, msg, color) {
  return '<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + title + '</title></head>' +
    '<body style="background:#1e1b18;color:' + color + ';font-family:sans-serif;text-align:center;padding-top:80px;">' +
    '<h2>' + title + '</h2><p>' + msg + '</p></body></html>'
}
