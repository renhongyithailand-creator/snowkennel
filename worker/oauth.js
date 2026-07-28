/**
 * GitHub OAuth 代理 — Cloudflare Worker
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
        return new Response('Error: no code', { status: 400,
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

        if (tokenData.error || !tokenData.access_token) {
          return new Response(
            '<!doctype html><h1>登录失败</h1><p>' + (tokenData.error_description || '未知错误') + '</p>',
            { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          )
        }

        // Netlify CMS v2 需要的消息格式: { token: "..." }
        var html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
          '<h2>✅ 登录成功</h2>' +
          '<script>' +
          '(function(){' +
          'var win=window.opener||window.parent;' +
          'win.postMessage({token:"' + tokenData.access_token + '"},"*");' +
          'setTimeout(function(){window.close()},1000);' +
          '})();' +
          '</script></body></html>'
        return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })

      } catch (e) {
        return new Response('Error: ' + e.message, { status: 500,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
      }
    }

    return new Response('OK', { headers: { 'Content-Type': 'text/plain' } })
  }
}
