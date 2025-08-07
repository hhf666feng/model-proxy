// api/proxy.ts
export const config = {
  runtime: "vercel-deno",
  regions: ["iad1", "sfo1", "lhr1"], // 优先部署到北美/欧洲节点
};

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // 从 Vercel 路由中提取目标路径（去除 /api 前缀）
  const pathname = url.pathname.replace(/^\/api/, '');

  // 根路径响应
  if (pathname === '/' || pathname === '/index.html') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <head><title>Claude Proxy (Vercel)</title></head>
        <body>
          <h1>Proxy is Running on Vercel!</h1>
          <p>支持 Claude 3.5 API 代理</p>
        </body>
      </html>
    `, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
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
    // 构建请求头（保留 Claude 必需的头信息）
    const headers = new Headers();
    const allowedHeaders = [
      'accept', 'content-type', 'authorization',
      'anthropic-version', 'x-api-key'
    ];
    
    for (const [key, value] of request.headers.entries()) {
      const lowerKey = key.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        headers.set(key, value);
      }
    }

    // 添加 Vercel 环境适配头
    headers.set('Host', targetHost);
    headers.set('X-Forwarded-For', url.hostname);
    headers.set('User-Agent', 'Vercel-Deno-Proxy');

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
      target: targetUrl
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
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'accept, content-type, authorization, anthropic-version, x-api-key',
        'Access-Control-Max-Age': '86400'
      }
    });
  }
  return new Response(null, { headers: { 'Allow': 'GET, POST, OPTIONS' } });
}

// 导出 Vercel 处理函数
export default async (request: Request) => {
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  return handleRequest(request);
};
