import os
import uuid
import requests
import warnings
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from flask import Flask, request, jsonify, send_from_directory

# Отключаем предупреждения о небезопасном HTTPS-соединении (только для тестирования!)
warnings.simplefilter('ignore', InsecureRequestWarning)

app = Flask(__name__, static_folder='../docs', static_url_path='')

# Словарь для маппинга возраста на значение параметра 'front'
# Здесь в нашем случае значение будет использовано как имя модели.
FRONT_MAPPING = {
    "18-24": "GigaChat",         # Пример: для возрастной группы 18-24 используем модель GigaChat
    "25-34": "GigaChat-Pro",     # Для 25-34 – модель GigaChat-Pro
    "35-44": "GigaChat-Max",     # Для 35-44 – модель GigaChat-Max
    "45-54": "GigaChat",         # Можно задать и повторно ту же модель, если других вариантов нет
    "55+":   "GigaChat"          # Или установить модель по умолчанию для старшей группы
}

def get_access_token():
    """
    Получает Access token от Gigachad.
    Должны быть заданы переменные окружения или напрямую вставлены данные:
    - GIGACHAD_OAUTH_URL (по умолчанию используется 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth')
    - Authorization key для Basic авторизации.
    
    :return: str (Access token) или None, если произошла ошибка.
    """
    oauth_url = os.environ.get("GIGACHAD_OAUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth")
    payload = {
        'scope': 'GIGACHAT_API_PERS'
    }
    # Генерируем уникальный идентификатор запроса
    rq_uid = str(uuid.uuid4())
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': rq_uid,
        'Authorization': 'Basic YjU0MDhiMjEtOWVhMC00OGVhLTgzZWEtMWI0ZjljMjg3Yzk0OjVlMTE1ZDdkLTNlYTItNGYzNS05ZjEzLWI1MGJlMDNlYjcwYw=='  # замените на свои данные или задайте через переменные окружения
    }
    
    try:
        response = requests.post(oauth_url, headers=headers, data=payload, timeout=10, verify=False)
        print("Статус ответа OAuth:", response.status_code)
        print("Ответ OAuth:", response.text)
        response.raise_for_status()
        data = response.json()
        access_token = data.get('access_token')
        if not access_token:
            print("Не удалось получить access_token из ответа:", data)
            return None
        print("Получен Access token:", access_token)
        return access_token
    except requests.exceptions.RequestException as e:
        print("Ошибка при получении Access token:", e)
        return None

def call_gigachat_api(front_value, user_message, access_token):
    """
    Вызывает Gigachad API для отправки сообщения и получения чат-ответа.
    Используется endpoint /chat/completions.
    
    :param front_value: str, значение параметра, определяющее модель (например, "GigaChat")
    :param user_message: str, сообщение пользователя
    :param access_token: str, актуальный токен
    :return: строка с ответом чат-бота или сообщение об ошибке
    """
    # Endpoint для генерации ответа (относительный URL: /chat/completions)
    api_url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    
    # Формируем payload согласно документации.
    # Здесь поле "model" задаётся выбранным значением (например, "GigaChat").
    # Массив messages содержит одно сообщение от пользователя.
    payload = {
        "model": front_value,
        "messages": [
            {"role": "user", "content": user_message}
        ],
        "stream": False,
        "update_interval": 0
    }
    
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}'
    }
    
    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=10, verify=False)
        response.raise_for_status()
        data = response.json()
        print("Ответ от Gigachat API:", data)
        # Извлекаем ответ модели из первого элемента массива choices
        if "choices" in data and len(data["choices"]) > 0:
            chat_message = data["choices"][0]["message"]["content"]
            return chat_message
        else:
            return "Чат-ответ не получен от Gigachat API"
    except requests.exceptions.RequestException as e:
        error_msg = f"Ошибка при обращении к Gigachat API: {e}"
        print(error_msg)
        return error_msg

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    age = data.get('age', '18-24')
    # Получаем имя модели из маппинга по возрасту. Если возраст не выбран, используем значение по умолчанию.
    front_value = FRONT_MAPPING.get(age, "GigaChat")
    
    # Получаем токен для доступа к API Gigachat
    token = get_access_token()
    if not token:
        return jsonify({"reply": "Ошибка: не удалось получить токен доступа."})
    
    # Вызываем Gigachat API для получения чат-ответа
    bot_reply = call_gigachat_api(front_value, user_message, token)
    
    return jsonify({"reply": bot_reply})

# Отдаём фронтенд (index.html и статику) из папки docs
@app.route('/')
def root():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)
