/**
 * Decap CMS GitHub OAuth 代理 — Cloudflare Worker
 *
 * 部署前需要设置两个密钥：
 *   npx wrangler secret put GITHUB_CLIENT_ID
 *   npx wrangler secret put GITHUB_CLIENT_SECRET
 *
 * 这两个值来自 GitHub OAuth App 设置页面
 */

const GITHUB_AUTH = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token'

// 生成随机字符串
function randomStr(len) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  var result = ''
  for (var i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// HTML 模板 — 成功后通过 postMessage 把 token 传回 Decap CMS
function successHtml(token) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>登录成功</title></head>
<body style="background:#1e1b18;color:#b8944c;font-family:sans-serif;text-align:center;padding-top:80px;">
  <h2>✅ 登录成功</h2><p>窗口即将关闭…</p>
  <script>
    (function() {
      window.opener.postMessage({
        auth_token: "${token}",
        provider: "github"
      }, window.opener.location.origin || "*");
      setTimeout(function(){ window.close(); }, 1500);
    })();
  </script>
</body></html>`
}

// 错误 HTML
function errorHtml(msg) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>登录失败</title></head>
<body style="background:#1e1b18;color:#d44;font-family:sans-serif;text-align:center;padding-top:80px;">
  <h2>❌ 登录失败</h2><p>${msg}</p><p><small>请关闭窗口重试</small></p>
</body></html>`
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url)
    var path = url.pathname

    // /auth — 第一步：重定向到 GitHub 授权页
    if (path === '/auth') {
      var state = randomStr(32)
      var params = new URLSearchParams({
        client_id: env.GITHUB_CLIENT_ID,
        redirect_uri: url.origin + '/callback',
        scope: 'repo,user',
        state: state
      })
      var redirect = GITHUB_AUTH + '?' + params.toString()
      var resp = Response.redirect(redirect, 302)
      // 把 state 存到 cookie，回调时验证
      resp.headers.set('Set-Cookie', `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`)
      return resp
    }

    // /callback — 第二步：GitHub 回调，换取 token
    if (path === '/callback') {
      // 验证 state 参数
      var cookies = request.headers.get('Cookie') || ''
      var stateMatch = cookies.match(/oauth_state=([^;]+)/)
      var savedState = stateMatch ? stateMatch[1] : ''
      var returnedState = url.searchParams.get('state') || ''

      if (!savedState || savedState !== returnedState) {
        return new Response(errorHtml('安全验证失败，请重新登录'), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 403
        })
      }

      var code = url.searchParams.get('code')
      if (!code) {
        return new Response(errorHtml('未收到授权码，请返回重试'), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 400
        })
      }

      // 用 code 换 access token
      try {
        var tokenResp = await fetch(GITHUB_TOKEN, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            client_id: env.GITHUB_CLIENT_ID,
            client_secret: env.GITHUB_CLIENT_SECRET,
            code: code
          })
        })

        var tokenData = await tokenResp.json()

        if (tokenData.error) {
          return new Response(errorHtml(tokenData.error_description || tokenData.error), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 400
          })
        }

        if (!tokenData.access_token) {
          return new Response(errorHtml('获取 token 失败，请重试'), {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
            status: 500
          })
        }

        return new Response(successHtml(tokenData.access_token), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        })

      } catch (e) {
        return new Response(errorHtml('网络错误：' + e.message), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
          status: 500
        })
      }
    }

    // 其他路径
    return new Response('Decap CMS OAuth Proxy for Snow Kennel', {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    })
  }
}
