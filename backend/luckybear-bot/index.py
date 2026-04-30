import json
import os
import time
import urllib.request

BOT_TOKEN = os.environ.get('LUCKYBEAR_PRO_BOT_TOKEN', '')
LINK_URL = 'https://lb777.xyz/6bb5S3'
TG_API = f'https://api.telegram.org/bot{BOT_TOKEN}'

WELCOME_TEXT = (
    "Lucky Bear PRO — твой личный гид по актуальным ссылкам.\n\n"
    "Никакого спама, игр и лишних движений.\n"
    "Я здесь, чтобы ты всегда попадал туда, куда нужно — по рабочим зеркалам и обновлениям.\n\n"
    "👉 Просто отправь /start или нажми «Старт» — и получи всё, что актуально прямо сейчас.\n\n"
    "Будь на связи с Lucky Bear PRO 🍀"
)

SUBSCRIBERS = {}

def tg_request(method: str, payload: dict) -> dict:
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        f'{TG_API}/{method}',
        data=data,
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode('utf-8'))

def keyboard_with_state(chat_id: int) -> dict:
    auto_on = SUBSCRIBERS.get(chat_id, {}).get('auto_send', False)
    toggle_text = '🔕 Выключить авторассылку' if auto_on else '🔔 Включить авторассылку'
    return {
        'inline_keyboard': [
            [{'text': '🔗 Получить актуальную ссылку', 'callback_data': 'get_link'}],
            [{'text': toggle_text, 'callback_data': 'toggle_auto'}],
        ]
    }

def send_welcome(chat_id: int) -> None:
    tg_request('sendMessage', {
        'chat_id': chat_id,
        'text': WELCOME_TEXT,
        'reply_markup': keyboard_with_state(chat_id),
    })

def send_link(chat_id: int) -> None:
    tg_request('sendMessage', {
        'chat_id': chat_id,
        'text': f'🍀 Актуальная ссылка:\n\n{LINK_URL}',
        'reply_markup': keyboard_with_state(chat_id),
    })

def check_auto_send(chat_id: int) -> None:
    sub = SUBSCRIBERS.get(chat_id)
    if not sub or not sub.get('auto_send'):
        return
    last = sub.get('last_sent_at', 0)
    now = time.time()
    if now - last >= 2 * 24 * 60 * 60:
        tg_request('sendMessage', {
            'chat_id': chat_id,
            'text': f'{WELCOME_TEXT}\n\n🍀 Актуальная ссылка:\n{LINK_URL}',
            'reply_markup': keyboard_with_state(chat_id),
        })
        sub['last_sent_at'] = now

def handle_update(update: dict) -> None:
    if 'message' in update:
        msg = update['message']
        chat_id = msg['chat']['id']
        text = msg.get('text', '')
        if chat_id not in SUBSCRIBERS:
            SUBSCRIBERS[chat_id] = {'auto_send': False, 'last_sent_at': 0}
        check_auto_send(chat_id)
        send_welcome(chat_id)
        _ = text
    elif 'callback_query' in update:
        cb = update['callback_query']
        chat_id = cb['message']['chat']['id']
        data = cb.get('data', '')
        if chat_id not in SUBSCRIBERS:
            SUBSCRIBERS[chat_id] = {'auto_send': False, 'last_sent_at': 0}
        try:
            tg_request('answerCallbackQuery', {'callback_query_id': cb['id']})
        except Exception:
            pass
        if data == 'get_link':
            send_link(chat_id)
        elif data == 'toggle_auto':
            sub = SUBSCRIBERS[chat_id]
            sub['auto_send'] = not sub.get('auto_send', False)
            if sub['auto_send']:
                sub['last_sent_at'] = time.time()
                tg_request('sendMessage', {
                    'chat_id': chat_id,
                    'text': '✅ Авторассылка включена! Буду присылать актуальную ссылку каждые 2 дня.',
                    'reply_markup': keyboard_with_state(chat_id),
                })
            else:
                tg_request('sendMessage', {
                    'chat_id': chat_id,
                    'text': '🔕 Авторассылка отключена.',
                    'reply_markup': keyboard_with_state(chat_id),
                })
        check_auto_send(chat_id)

def handler(event, context):
    '''
    Telegram webhook бота Lucky Bear PRO.
    Обрабатывает /start, кнопки получения ссылки и переключения авторассылки.
    '''
    method = event.get('httpMethod', 'POST')
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            'body': '',
        }
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'ok': True, 'bot': 'luckybear-pro'}),
        }
    try:
        body = event.get('body') or '{}'
        update = json.loads(body)
        handle_update(update)
    except Exception as e:
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'ok': False, 'error': str(e)}),
        }
    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'ok': True}),
    }
