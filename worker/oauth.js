/**
 * 思糯犬舍 OAuth 代理 — Cloudflare Worker
 *
 * 直接使用 PAT 认证，跳过 GitHub OAuth
 * 部署前设置密钥：GITHUB_PAT = ghp_xxx
 */
export default {
  async fetch(request, env) {
    var url = new URL(request.url)

    // /auth — 把弹窗重定向到同域 callback.html，token 走 URL hash
    if (url.pathname === '/auth') {
      return Response.redirect(
        'https://www.snowkennel.com/admin/callback.html#' + env.GITHUB_PAT,
        302
      )
    }

    return new Response('Snow Kennel Auth ✅')
  }
}
