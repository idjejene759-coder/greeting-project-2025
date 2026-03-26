import json
import os
import psycopg2
import urllib.request
from datetime import datetime, timedelta
from typing import Dict, Any

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

PLANS = {
    1:  {'months': 1,  'amount': 2.5,  'label': '1 месяц'},
    3:  {'months': 3,  'amount': 5.0,  'label': '3 месяца'},
    6:  {'months': 6,  'amount': 10.0, 'label': '6 месяцев'},
    12: {'months': 12, 'amount': 23.0, 'label': '1 год'},
}

def db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def schema():
    return os.environ.get('MAIN_DB_SCHEMA', 't_p45110186_greeting_project_202')

def cryptobot(method, params=None):
    token = os.environ['CRYPTOBOT_TOKEN']
    url = f'https://pay.crypt.bot/api/{method}'
    data = json.dumps(params or {}).encode()
    req = urllib.request.Request(url, data=data, headers={
        'Crypto-Pay-API-Token': token,
        'Content-Type': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read())

def ok(body):
    return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(body)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''Создание инвойса CryptoBot и активация VIP после оплаты'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    s = schema()

    if action == 'create_invoice':
        user_id = body.get('userId')
        months = int(body.get('months', 1))
        plan = PLANS.get(months)
        if not plan or not user_id:
            return err('Неверные параметры')

        resp = cryptobot('createInvoice', {
            'currency_type': 'fiat',
            'fiat': 'USD',
            'amount': str(plan['amount']),
            'accepted_assets': 'USDT,TON',
            'description': f"VIP подписка на {plan['label']}",
            'expires_in': 3600
        })

        if not resp.get('ok'):
            return err('Ошибка создания инвойса')

        invoice = resp['result']
        invoice_id = invoice['invoice_id']
        pay_url = invoice['bot_invoice_url']

        conn = db()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {s}.vip_payments (user_id, invoice_id, months, amount_usd, status) VALUES (%s, %s, %s, %s, 'pending')",
            (user_id, invoice_id, months, plan['amount'])
        )
        conn.commit()
        cur.close()
        conn.close()

        return ok({'invoiceId': invoice_id, 'payUrl': pay_url, 'amount': plan['amount'], 'months': months})

    elif action == 'check_payment':
        invoice_id = body.get('invoiceId')
        user_id = body.get('userId')
        if not invoice_id or not user_id:
            return err('Неверные параметры')

        resp = cryptobot('getInvoices', {'invoice_ids': str(invoice_id)})
        if not resp.get('ok') or not resp['result']['items']:
            return err('Инвойс не найден')

        invoice = resp['result']['items'][0]
        status = invoice.get('status')

        if status != 'paid':
            return ok({'paid': False, 'status': status})

        conn = db()
        cur = conn.cursor()
        cur.execute(f"SELECT status, months FROM {s}.vip_payments WHERE invoice_id = %s AND user_id = %s", (invoice_id, user_id))
        row = cur.fetchone()
        if not row:
            cur.close(); conn.close()
            return err('Платёж не найден')

        if row[0] == 'paid':
            cur.close(); conn.close()
            return ok({'paid': True, 'alreadyActivated': True})

        months = row[1]
        cur.execute(f"SELECT vip_expires_at FROM {s}.users WHERE id = %s", (user_id,))
        u = cur.fetchone()
        base = datetime.now()
        if u and u[0] and u[0] > base:
            base = u[0]
        new_expires = base + timedelta(days=30 * months)

        cur.execute(
            f"UPDATE {s}.users SET is_vip = TRUE, vip_expires_at = %s, vip_months = %s WHERE id = %s",
            (new_expires, months, user_id)
        )
        cur.execute(
            f"UPDATE {s}.vip_payments SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE invoice_id = %s",
            (invoice_id,)
        )
        conn.commit()
        cur.close()
        conn.close()

        return ok({'paid': True, 'expiresAt': new_expires.isoformat(), 'months': months})

    return err('Неизвестное действие')
