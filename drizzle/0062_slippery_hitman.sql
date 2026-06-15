-- Перевод всех наивных timestamp-колонок (timestamp without time zone) в
-- timestamptz (timestamp with time zone), чтобы хранение моментов времени не
-- зависело от таймзоны процесса Node/сессии Postgres.
--
-- Накопленные значения писались прод-процессом в UTC (UTC wall-clock), поэтому
-- конвертация выполняется через `AT TIME ZONE 'UTC'` — она НЕ зависит от
-- TimeZone текущей сессии и не сдвигает существующие данные.
--
-- Блок идемпотентен: конвертируются только колонки, которые ещё имеют тип
-- `timestamp without time zone`; уже-timestamptz колонки (включая ранее
-- переведённые todos.completed_at / todos.archived_at) пропускаются. Поэтому
-- повторный или частичный прогон миграции безопасен.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT c.table_name, c.column_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema
     AND t.table_name = c.table_name
     AND t.table_type = 'BASE TABLE'
    WHERE c.table_schema = 'public'
      AND c.data_type = 'timestamp without time zone'
  LOOP
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN %I SET DATA TYPE timestamptz USING %I AT TIME ZONE ''UTC''',
      r.table_name, r.column_name, r.column_name
    );
  END LOOP;
END $$;
