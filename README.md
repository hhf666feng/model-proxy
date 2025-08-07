# Model Proxy: 跨域代理 OpenAI/Claude/Groq 等 AI 模型 API
![Deploy with Vercel](https://vercel.com/button)  
![Deploy with Deno](https://deno.com/deno-deploy-button.svg)

## 项目简介
**Model Proxy** 是一款轻量级跨域代理服务，专注于解决海外 AI 模型 API 的地域访问限制问题。通过简单部署，即可实现对 OpenAI、Claude、Groq 等主流 AI 服务的无缝代理，让国内环境也能顺畅调用各类大语言模型 API，无需担心网络拦截或跨域限制。

### 核心优势
- ✅ **多模型支持**：兼容 Claude 3.5/3 系列、OpenAI GPT 系列、Groq 等主流模型 API
- ✅ **双平台部署**：支持 Deno Deploy 和 Vercel 一键部署，零复杂配置
- ✅ **原生兼容**：完整保留原始 API 功能与参数格式，无需修改业务代码
- ✅ **跨域自动处理**：内置 CORS 支持，解决浏览器/客户端跨域请求限制
- ✅ **轻量高效**：基于 Deno  runtime 构建，资源占用低，响应速度快
- ✅ **透明代理**：请求/响应完整转发，不修改原始数据，确保调用稳定性

## 快速部署指南

### 选项 1：Deno Deploy 部署（推荐）
1. 访问 [Deno Deploy 控制台](https://dash.deno.com/account/projects) 并登录
2. 点击右上角 **New Playground** 创建新项目
3. 复制项目中 `src/deployments/deno.ts` 的完整代码粘贴到编辑器
4. 点击 **Save & Deploy**，获取部署域名（格式：`xxx.deno.dev`）


### 选项 2：Vercel 一键部署
1. 点击上方 **Deploy with Vercel** 按钮
2. 关联 GitHub 账号并自动创建仓库（仓库名可自定义）
3. 等待部署完成，获取域名（格式：`xxx.vercel.app`）

### 本地开发
```bash
# Vercel 本地开发
npm run dev:vercel

# Deno 本地开发  
npm run dev:deno
```


## 快速使用指南
部署完成后，通过以下方式调用目标模型 API（只需替换域名即可）：

### 调用 Claude 模型 API
```bash
curl https://你的部署域名/api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "X-API-Key: 你的 Claude API 密钥" \
  -H "Anthropic-Version: 2023-06-01" \
  -d '{
    "model": "claude-3-5-sonnet-20240620",
    "messages": [
      {
        "role": "user",
        "content": "请简要介绍 Claude 3.5 Sonnet 的特点"
      }
    ],
    "max_tokens": 300
  }'
```

### 调用 OpenAI 模型 API
```bash
curl https://你的部署域名/api.openai.com/v1/chat/completions \
  -H "Authorization: Bearer 你的 OpenAI API 密钥" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello World"}]
  }'
```

### 调用 Groq 模型 API
```bash
curl https://你的部署域名/api.groq.com/v1/chat/completions \
  -H "Authorization: Bearer 你的 Groq API 密钥" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-70b-8192",
    "messages": [{"role": "user", "content": "Hello World"}]
  }'
```


## 技术原理
### 代理工作流程
1. **路径解析**：从请求路径中提取目标服务域名（如 `/api.anthropic.com/v1/messages` 提取 `api.anthropic.com`）
2. **请求转发**：保留核心请求头（`X-API-Key`、`Authorization` 等），转发完整请求体
3. **跨域处理**：自动添加 CORS 响应头，解决浏览器跨域限制
4. **响应回传**：完整转发目标服务的响应内容，保持原始格式不变

### 支持的模型服务列表
| 服务名称       | 代理路径前缀                | 官方 API 文档                          | 支持模型示例                |
|----------------|-----------------------------|---------------------------------------|-----------------------------|
| Claude         | `/api.anthropic.com`        | [Anthropic Docs](https://docs.anthropic.com) | Claude 3.5 Sonnet/Opus、Claude 3 Haiku |
| OpenAI         | `/api.openai.com`           | [OpenAI Docs](https://platform.openai.com/docs) | GPT-4、GPT-3.5 Turbo、DALL·E |
| Groq           | `/api.groq.com`             | [Groq Docs](https://console.groq.com/docs) | Llama 3、Mixtral、Gemma      |
| （扩展支持）   | 按域名前缀添加即可          | -                                     | 任意支持 HTTP API 的模型服务 |


## 问题排查
### 常见错误及解决方法
| 错误码 | 可能原因                  | 解决方法                                  |
|--------|---------------------------|-------------------------------------------|
| 403    | API 密钥错误或权限不足    | 检查密钥有效性，确认模型访问权限          |
| 500    | 代理配置错误或网络问题    | 查看部署平台日志，检查目标服务是否可用    |
| 跨域错误 | 客户端跨域限制            | 无需额外配置，代理已默认开启 CORS 支持    |
| 超时错误 | 部署区域与目标服务距离远  | 在 Vercel 配置中切换至美国节点（如 `iad1`）|

### 日志查看方式
- **Deno Deploy**：进入项目 → **Logs** 标签页查看实时请求日志
- **Vercel**：进入项目 → **Functions** → 选择代理函数查看调用日志


## 自定义扩展
如需扩展功能，可修改核心代码中的关键配置：
- **添加请求头**：在 `allowedHeaders` 数组中添加需要转发的自定义头
- **调整部署区域**：在 `vercel.json` 的 `regions` 字段中配置最优节点
- **扩展服务支持**：无需修改代码，直接通过目标服务域名前缀调用即可


## 部署注意事项
- **免费额度限制**：Vercel 免费计划每月提供 100GB 带宽，高频使用建议升级
- **节点选择**：推荐部署在北美节点（如 Vercel 的 `iad1`、`sfo1`），减少访问延迟
- **安全提示**：请勿公开分享包含 API 密钥的请求链接，避免密钥泄露
- **自定义域名**：可在部署平台绑定自定义域名，提升访问稳定性


## 许可证
本项目采用 MIT 许可证，允许自由使用、修改和分发，详情见 LICENSE 文件。

Model Proxy 致力于为开发者提供便捷的 AI 模型访问解决方案，让跨地域调用 AI 模型 API 变得简单高效。
