// main.ts - Deno Deploy 版本
async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // 根路径响应
  if (pathname === '/' || pathname === '/index.html') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Model Proxy (Deno Deploy)</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .service { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
            .endpoint { font-family: monospace; background: #e0e0e0; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <h1>🚀 Model Proxy is Running on Deno Deploy!</h1>
          <p>支持以下 AI 模型 API 代理：</p>
          
          <div class="service">
            <h3>Claude 3.5/3 系列</h3>
            <p>代理端点：<span class="endpoint">/api.anthropic.com/v1/messages</span></p>
          </div>
          
          <div class="service">
            <h3>OpenAI GPT 系列</h3>
            <p>代理端点：<span class="endpoint">/api.openai.com/v1/chat/completions</span></p>
          </div>
          
          <div class="service">
            <h3>Groq LLM 系列</h3>
            <p>代理端点：<span class="endpoint">/api.groq.com/v1/chat/completions</span></p>
          </div>
          
          <p><strong>使用方法：</strong>将原 API 域名替换为你的 Deno Deploy 域名即可</p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  // 解析目标 URL（例如：/api.anthropic.com/v1/messages → https://api.anthropic.com/v1/messages）
  const firstSlashIndex = pathname.indexOf('/', 1);
  let targetHost, targetPath;
  
  if (firstSlashIndex === -1) {
    targetHost = pathname.substring(1);
    targetPath = '/';
  } else {
    targetHost = pathname.substring(1, firstSlashIndex);
    targetPath = pathname.substring(firstSlashIndex);
  }

  const targetUrl = `https://${targetHost}${targetPath}${url.search}`;

  try {
    // 构建请求头（保留必要的头信息）
    const headers = new Headers();
    const allowedHeaders = [
      'accept', 'accept-encoding', 'accept-language',
      'content-type', 'authorization', 'anthropic-version', 
      'x-api-key', 'user-agent', 'origin', 'referer'
    ];
    
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        headers.set(key, value);
      }
    }

    // 添加代理相关头信息
    headers.set('Host', targetHost);
    headers.set('X-Forwarded-For', '127.0.0.1');
    headers.set('X-Forwarded-Proto', 'https');
    headers.set('User-Agent', 'Deno-Deploy-Proxy/1.0');

    // 发送代理请求
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body,
      redirect: 'follow'
    });

    // 构建响应头（支持 CORS）
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', allowedHeaders.join(', '));
    responseHeaders.set('Referrer-Policy', 'no-referrer');
    responseHeaders.delete('content-security-policy');
    responseHeaders.delete('x-frame-options');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });

  } catch (error) {
    console.error('代理请求失败:', error);
    return new Response(JSON.stringify({
      error: '代理请求失败',
      details: error instanceof Error ? error.message : String(error),
      target: targetUrl,
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      } 
    });
  }
}

// 处理 OPTIONS 预检请求
async function handleOptions(request: Request): Promise<Response> {
  if (
    request.headers.get('Origin') &&
    request.headers.get('Access-Control-Request-Method') &&
    request.headers.get('Access-Control-Request-Headers')
  ) {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'accept, content-type, authorization, anthropic-version, x-api-key, user-agent',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  return new Response(null, { headers: { 'Allow': 'GET, POST, PUT, DELETE, OPTIONS' } });
}

// 导出 Deno Deploy 处理函数
addEventListener('fetch', event => {
  event.respondWith((async () => {
    const request = event.request;
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    return handleRequest(request);
  })());
});