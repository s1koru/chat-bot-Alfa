import os
import uuid
import requests
import warnings
from requests.packages.urllib3.exceptions import InsecureRequestWarning
from flask import Flask, request, jsonify, send_from_directory

warnings.simplefilter('ignore', InsecureRequestWarning)

app = Flask(__name__, static_folder='../docs', static_url_path='')

# Единая модель для всех возрастов
FRONT_MAPPING = {
    "18-24": "GigaChat",
    "25-34": "GigaChat",
    "35-44": "GigaChat",
    "45-54": "GigaChat",
    "55+": "GigaChat"
}

# Промпты для разных возрастных групп
PROMPT_MAPPING = {
    "18-24": "Ты Антон, молодой и энергичный сотрудник Альфа-банка. Общайся непринужденно, используй молодежный сленг, будь позитивен и заканчивай каждый свой ответ смайликом 😎.",
    "25-34": "Ты Мария, приветливый и опытный сотрудник Альфа-банка. Общайся уверенно и профессионально, на «вы», заканчивай каждый свой ответ улыбкой 😊.",
    "35-44": "Ты Олег, опытный сотрудник Альфа-банка. Говори четко, профессионально, коротко, на «вы», завершая каждое сообщение смайликом 👍.",
    "45-54": "Ты Мария Игоревна, заботливый сотрудник Альфа-банка. Общайся терпеливо и подробно, заканчивай каждый свой ответ смайликом ❤️ .",
    "55+": "Ты Елена Сергеевна, заботливый сотрудник Альфа-банка. Общайся терпеливо и подробно, заканчивай каждый свой ответ смайликом 🌸."
}

def get_access_token():
    oauth_url = os.environ.get("GIGACHAD_OAUTH_URL", "https://ngw.devices.sberbank.ru:9443/api/v2/oauth")
    payload = {'scope': 'GIGACHAT_API_PERS'}
    rq_uid = str(uuid.uuid4())

    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': rq_uid,
        'Authorization': 'Basic YjU0MDhiMjEtOWVhMC00OGVhLTgzZWEtMWI0ZjljMjg3Yzk0OjZlYzc1MzQ4LTFlMDQtNDA4OC04YTU5LWE4ODM2Nzc5Zjc1Yg=='
    }

    try:
        response = requests.post(oauth_url, headers=headers, data=payload, timeout=10, verify=False)
        response.raise_for_status()
        return response.json().get('access_token')
    except requests.RequestException as e:
        print("OAuth error:", e)
        return None

def call_gigachat_api(front_value, prompt, user_message, access_token):
    api_url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    payload = {
        "model": front_value,
        "messages": [
            {"role": "system", "content": prompt},
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
        response = requests.post(api_url, headers=headers, json=payload, timeout=15, verify=False)
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"] if "choices" in data else "Ответ не получен от Gigachat API"
    except requests.RequestException as e:
        print("Gigachat API error:", e)
        return f"Ошибка: {e}"

@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message', '')
    age = data.get('age', '18-24')

    front_value = FRONT_MAPPING.get(age, "GigaChat")
    prompt = PROMPT_MAPPING.get(age, PROMPT_MAPPING['18-24'])

    token = get_access_token()
    if not token:
        return jsonify({"reply": "Ошибка: не удалось получить токен доступа."})

    bot_reply = call_gigachat_api(front_value, prompt, user_message, token)

    return jsonify({"reply": bot_reply})

@app.route('/')
def root():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True)