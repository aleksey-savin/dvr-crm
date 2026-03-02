# API Documentation

## Аутентификация

Для использования API необходимо создать API ключ в разделе **Настройки** (`/preferences`).

API ключ передается в заголовке `Authorization` в формате:
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### POST `/api/meetings`

Создание нового meeting (встречи/звонка).

#### Headers

```
Authorization: Bearer sk-XXXXXXXXXXXXXXXX
Content-Type: application/json
```

#### Request Body

```json
{
  "id": "optional-custom-id",
  "title": "Встреча с клиентом ABC",
  "summary": "Обсуждение годового контракта и условий сотрудничества",
  "transcription": "Полная расшифровка встречи...",
  "companyId": "company-uuid"
}
```

#### Параметры

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `id` | string | Нет | ID встречи (если не указан, генерируется автоматически) |
| `title` | string | **Да** | Название встречи |
| `summary` | string | Нет | Краткое описание/резюме встречи |
| `transcription` | string | Нет | Полная расшифровка встречи |
| `companyId` | string | Нет | ID компании (ссылка на таблицу `company`) |

#### Успешный ответ (201 Created)

```json
{
  "success": true,
  "meeting": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Встреча с клиентом ABC",
    "summary": "Обсуждение годового контракта и условий сотрудничества",
    "transcription": "Полная расшифровка встречи...",
    "companyId": "company-uuid"
  }
}
```

#### Ошибки

**401 Unauthorized** - Отсутствует или неверный API ключ
```json
{
  "error": "Invalid API key"
}
```

**400 Bad Request** - Ошибка валидации данных
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Title is required",
      "path": ["title"]
    }
  ]
}
```

**500 Internal Server Error** - Внутренняя ошибка сервера
```json
{
  "error": "Internal server error",
  "message": "Error description"
}
```

## Примеры использования

### cURL

```bash
curl -X POST https://your-domain.com/api/meetings \
  -H "Authorization: Bearer sk-XXXXXXXXXXXXXXXX" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Встреча с клиентом",
    "summary": "Обсуждение проекта",
    "companyId": "company-123"
  }'
```

### JavaScript (fetch)

```javascript
const apiKey = 'sk-XXXXXXXXXXXXXXXX';

const createMeeting = async () => {
  const response = await fetch('https://your-domain.com/api/meetings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: 'Встреча с клиентом',
      summary: 'Обсуждение проекта',
      transcription: 'Полная расшифровка...',
      companyId: 'company-123',
    }),
  });

  const data = await response.json();
  
  if (response.ok) {
    console.log('Meeting created:', data.meeting);
  } else {
    console.error('Error:', data.error);
  }
};

createMeeting();
```

### Python (requests)

```python
import requests

api_key = 'sk-XXXXXXXXXXXXXXXX'
url = 'https://your-domain.com/api/meetings'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

data = {
    'title': 'Встреча с клиентом',
    'summary': 'Обсуждение проекта',
    'transcription': 'Полная расшифровка...',
    'companyId': 'company-123'
}

response = requests.post(url, json=data, headers=headers)

if response.status_code == 201:
    meeting = response.json()['meeting']
    print(f"Meeting created: {meeting['id']}")
else:
    print(f"Error: {response.json()['error']}")
```

### Node.js (axios)

```javascript
const axios = require('axios');

const apiKey = 'sk-XXXXXXXXXXXXXXXX';
const url = 'https://your-domain.com/api/meetings';

const createMeeting = async () => {
  try {
    const response = await axios.post(
      url,
      {
        title: 'Встреча с клиентом',
        summary: 'Обсуждение проекта',
        transcription: 'Полная расшифровка...',
        companyId: 'company-123',
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Meeting created:', response.data.meeting);
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.error);
    } else {
      console.error('Error:', error.message);
    }
  }
};

createMeeting();
```

## Безопасность

⚠️ **Важно:**
- Никогда не публикуйте API ключи в публичных репозиториях
- Храните ключи в переменных окружения или защищенных хранилищах секретов
- Регулярно обновляйте и ротируйте API ключи
- Удаляйте неиспользуемые ключи через интерфейс настроек

## Rate Limiting

В настоящее время ограничения на количество запросов не установлены, но рекомендуется:
- Не превышать 100 запросов в минуту
- Использовать exponential backoff при ошибках 429 или 500

## Поддержка

При возникновении проблем или вопросов обращайтесь к администратору системы.