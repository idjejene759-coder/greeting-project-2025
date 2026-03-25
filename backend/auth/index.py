import json
import os
import hashlib
import psycopg2
import random
import string
from typing import Dict, Any

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def generate_referral_code() -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Обробка реєстрації та авторизації користувачів
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    username = (body_data.get('username') or '').strip()
    password = (body_data.get('password') or '').strip()
    referral_code = (body_data.get('referralCode') or '').strip()
    
    if not username or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Имя пользователя и пароль обязательны'}),
            'isBase64Encoded': False
        }
    
    if len(username) < 3 or len(username) > 50:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Имя пользователя должно быть от 3 до 50 символов'}),
            'isBase64Encoded': False
        }
    
    if len(password) < 4:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Пароль должен быть минимум 4 символа'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if action == 'register':
            password_hash = hash_password(password)
            
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким именем уже существует'}),
                    'isBase64Encoded': False
                }
            
            referred_by_id = None
            if referral_code:
                cur.execute("SELECT id FROM users WHERE referral_code = %s", (referral_code,))
                referrer = cur.fetchone()
                if referrer:
                    referred_by_id = referrer[0]
            
            new_referral_code = generate_referral_code()
            while True:
                cur.execute("SELECT id FROM users WHERE referral_code = %s", (new_referral_code,))
                if not cur.fetchone():
                    break
                new_referral_code = generate_referral_code()
            
            cur.execute(
                "INSERT INTO users (username, password_hash, referral_code, referred_by) VALUES (%s, %s, %s, %s) RETURNING id, username, balance, referral_count, referral_code",
                (username, password_hash, new_referral_code, referred_by_id)
            )
            user = cur.fetchone()
            
            if referred_by_id:
                cur.execute(
                    "UPDATE users SET referral_count = referral_count + 1 WHERE id = %s",
                    (referred_by_id,)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'balance': user[2],
                        'referralCount': user[3],
                        'referralCode': user[4]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            password_hash = hash_password(password)
            
            cur.execute(
                "SELECT id, username, balance, referral_count, referral_code, is_banned, ban_reason FROM users WHERE username = %s AND password_hash = %s",
                (username, password_hash)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверное имя пользователя или пароль'}),
                    'isBase64Encoded': False
                }
            
            if user[5]:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ваш аккаунт заблокирован. Причина: {user[6]}'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("UPDATE users SET last_login_at = NOW() WHERE id = %s", (user[0],))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'balance': user[2],
                        'referralCount': user[3],
                        'referralCode': user[4]
                    }
                }),
                'isBase64Encoded': False
            }

        elif action == 'ping':
            user_id = body_data.get('userId')
            if user_id:
                cur.execute("UPDATE users SET last_login_at = NOW() WHERE id = %s", (user_id,))
                conn.commit()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'ok': True}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()