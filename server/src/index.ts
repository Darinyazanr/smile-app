import express from "express";
import cors from "cors";

const app = express();
const port = process.env.PORT || 9091;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.get('/api/v1/health', (req, res) => {
  console.log('Health check success');
  res.status(200).json({ status: 'ok' });
});

// 获取 Supabase 配置（供前端使用）
app.get('/api/v1/supabase-config', (req, res) => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.COZE_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.COZE_SUPABASE_ANON_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    res.json({
      url: supabaseUrl,
      anonKey: supabaseAnonKey,
    });
  } else {
    res.status(503).json({ 
      error: 'Supabase not configured',
      message: 'Please configure Supabase environment variables'
    });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}/`);
});
