-- ============================================================
-- 「今日微笑」Supabase 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中粘贴执行
-- ============================================================

-- 1. 创建 smile_records 表
CREATE TABLE IF NOT EXISTS public.smile_records (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  smiled      BOOLEAN NOT NULL DEFAULT FALSE,
  reason      TEXT,
  photo_path  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)  -- 每人每天只能有一条记录
);

-- 2. 索引：加速按用户 + 日期查询
CREATE INDEX IF NOT EXISTS idx_smile_records_user_date
  ON public.smile_records(user_id, date DESC);

-- 3. 索引：加速按用户 + 月份查询
CREATE INDEX IF NOT EXISTS idx_smile_records_user_month
  ON public.smile_records(user_id, date);

-- 4. 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_smile_records_updated_at ON public.smile_records;
CREATE TRIGGER trigger_smile_records_updated_at
  BEFORE UPDATE ON public.smile_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 开启 Row Level Security
ALTER TABLE public.smile_records ENABLE ROW LEVEL SECURITY;

-- 6. RLS 策略：用户只能读取自己的记录
DROP POLICY IF EXISTS "Users can read own records" ON public.smile_records;
CREATE POLICY "Users can read own records"
  ON public.smile_records
  FOR SELECT
  USING (auth.uid() = user_id);

-- 7. RLS 策略：用户只能插入自己的记录
DROP POLICY IF EXISTS "Users can insert own records" ON public.smile_records;
CREATE POLICY "Users can insert own records"
  ON public.smile_records
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. RLS 策略：用户只能更新自己的记录
DROP POLICY IF EXISTS "Users can update own records" ON public.smile_records;
CREATE POLICY "Users can update own records"
  ON public.smile_records
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 9. RLS 策略：用户只能删除自己的记录
DROP POLICY IF EXISTS "Users can delete own records" ON public.smile_records;
CREATE POLICY "Users can delete own records"
  ON public.smile_records
  FOR DELETE
  USING (auth.uid() = user_id);
