/**
 * GitHub OAuth 代理 — Cloudflare Worker
 *
 * 流程：
 * 1. CMS 开弹窗到 /auth
 * 2. /auth → GitHub 授权
 * 3. GitHub → /callback
 * 4. /callback → 重定向弹窗到 admin/callback.html（同域名）
 * 5. callback.html 发送 postMessage 给 CMS 主窗口
 */
export default {
  async fetch(request, env) {
    var url = new URL(request.url)
    var path = url.pathname

    if (path === '/auth') {
      var state = crypto.randomUUID()
      var authUrl = 'https://github.com/login/oauth/authorize' +
        '?client_id=' + encodeURIComponent(env.GITHUB_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(url.origin + '/callback') +
        '&scope=repo,user' +
        '&state=' + encodeURIComponent(state)
      return Response.redirect(authUrl, 302)
    }

    if (path === '/callback') {
      var code = url.searchParams.get('code')
      if (!code) {
        return new Response('Error: no code', { status: 400 })
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

        var data = await tokenResp.json()
        if (!data.access_token) {
          return new Response('Error: ' + JSON.stringify(data), { status: 500 })
        }

        // 重定向弹窗到同域名 callback 页面，token 放 hash
        return Response.redirect(
          'https://www.snowkennel.com/admin/callback.html#' + data.access_token,
          302
        )

      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500 })
      }
    }

    return new Response('OK')
  }
}
