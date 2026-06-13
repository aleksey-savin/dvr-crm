// Загружает .env и .env.local до импорта модулей, читающих process.env
// (ESM-импорты хойстятся, поэтому вызовы должны жить в отдельном модуле).
import { config } from 'dotenv'

config()
config({ path: '.env.local' })
