const express = require("express");
const path = require("path");
const promClient = require("prom-client");

const app = express();
const PORT = process.env.PORT || 3001;

// 创建一个 Registry
const register = new promClient.Registry();

// 添加默认的 metrics（如 process metrics）
promClient.collectDefaultMetrics({
  app: "todo-app",
  prefix: "todo_",
  timeout: 10000,
  register,
});

// 创建自定义 metrics
const httpRequestsTotal = new promClient.Counter({
  name: "todo_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "path", "status"],
  registers: [register],
});

const httpRequestDuration = new promClient.Histogram({
  name: "todo_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "path", "status"],
  registers: [register],
});

// 添加请求计数中间件
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    httpRequestsTotal.inc({
      method: req.method,
      path: req.path,
      status: res.statusCode,
    });
    httpRequestDuration.observe(
      {
        method: req.method,
        path: req.path,
        status: res.statusCode,
      },
      duration / 1000
    );
  });
  next();
});

// Serve static files from 'public' directory
app.use(express.static("public"));

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 添加 metrics 端点
app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Metrics available on http://localhost:${PORT}/metrics`);
});
