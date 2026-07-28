/**
 * GitHub OAuth 代理 — Cloudflare Worker
 */
export default {
  async fetch(request, env) {
    var url = new URL(request.url)
    var path = url.pathname

    // /auth — 跳转 GitHub 授权
    if (path === '/auth') {
      var state = crypto.randomUUID()
      var authUrl = 'https://github.com/login/oauth/authorize' +
        '?client_id=' + encodeURIComponent(env.GITHUB_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(url.origin + '/callback') +
        '&scope=repo,user' +
        '&state=' + encodeURIComponent(state)
      return Response.redirect(authUrl, 302)
    }

    // /callback — GitHub 回调，换 token，然后刷新主窗口
    if (path === '/callback') {
      var code = url.searchParams.get('code')
      if (!code) {
        return new Response('未收到授权码', { status: 400,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }

      try {
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

        if (!tokenData.access_token) {
          return new Response('获取 token 失败: ' + JSON.stringify(tokenData), { status: 500,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        }

        // 重定向主窗口到 admin 页面（带 token），关闭弹窗
        var html = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>' +
          '<script>' +
          'window.opener.location.href="https://www.snowkennel.com/admin/index.html#token=' + tokenData.access_token + '";' +
          'window.close();' +
          '</script></body></html>'
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

      } catch (e) {
        return new Response('错误: ' + e.message, { status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    }

    return new Response('Snow Kennel OAuth ✅')
  }
}
