// 文件路径：functions/api.js
// 这是一个运行在 Cloudflare 云端的代理脚本
export async function onRequestPost(context) {
  // 从 Cloudflare 的环境变量中安全获取 API Key
  const apiKey = context.env.SILICONFLOW_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "服务器未配置 API Key" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // 接收前端发来的数据
    const requestData = await context.request.json();

    // 由云端服务器向 SiliconFlow 发起真实请求，完美绕过浏览器的 CORS 限制
    const response = await fetch("https://api.siliconflow.cn/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });

    const data = await response.json();

    // 将结果返回给前端，并加上允许前端访问的跨域头
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}