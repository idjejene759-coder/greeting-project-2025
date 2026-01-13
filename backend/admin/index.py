import json
import os
import hashlib
import psycopg2
from typing import Dict, Any
from datetime import datetime

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление пользователями: авторизация админа, просмотр, редактирование, блокировка
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'login':
                username = (body_data.get('username') or '').strip()
                password = (body_data.get('password') or '').strip()
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Введите логин и пароль'}),
                        'isBase64Encoded': False
                    }
                
                password_hash = hash_password(password)
                
                cur.execute(
                    "SELECT id, username FROM admins WHERE username = %s AND password_hash = %s",
                    (username, password_hash)
                )
                admin = cur.fetchone()
                
                if not admin:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный логин или пароль'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'admin': {
                            'id': admin[0],
                            'username': admin[1]
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_user':
                user_id = body_data.get('userId')
                balance = body_data.get('balance')
                referral_count = body_data.get('referralCount')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя обязателен'}),
                        'isBase64Encoded': False
                    }
                
                updates = []
                params = []
                
                if balance is not None:
                    updates.append("balance = %s")
                    params.append(balance)
                
                if referral_count is not None:
                    updates.append("referral_count = %s")
                    params.append(referral_count)
                
                if not updates:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Нет данных для обновления'}),
                        'isBase64Encoded': False
                    }
                
                params.append(user_id)
                query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s RETURNING id, username, balance, referral_count"
                
                cur.execute(query, params)
                user = cur.fetchone()
                conn.commit()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': {
                            'id': user[0],
                            'username': user[1],
                            'balance': user[2],
                            'referralCount': user[3]
                        }
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'ban_user':
                user_id = body_data.get('userId')
                reason = (body_data.get('reason') or '').strip()
                
                if not user_id or not reason:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя и причина обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE users SET is_banned = TRUE, ban_reason = %s, banned_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id",
                    (reason, user_id)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Пользователь заблокирован'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unban_user':
                user_id = body_data.get('userId')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "UPDATE users SET is_banned = FALSE, ban_reason = NULL, banned_at = NULL WHERE id = %s RETURNING id",
                    (user_id,)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Пользователь разблокирован'}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неизвестное действие'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            # Не показываем заблокированных пользователей старше 7 дней (но не удаляем из БД)
            cur.execute(
                """
                SELECT id, username, balance, referral_count, is_banned, ban_reason, created_at 
                FROM users 
                WHERE NOT (is_banned = TRUE AND banned_at < CURRENT_TIMESTAMP - INTERVAL '7 days')
                ORDER BY created_at DESC
                """
            )
            users = cur.fetchall()
            
            users_list = []
            for user in users:
                users_list.append({
                    'id': user[0],
                    'username': user[1],
                    'balance': user[2],
                    'referralCount': user[3],
                    'isBanned': user[4] or False,
                    'banReason': user[5],
                    'createdAt': user[6].isoformat() if user[6] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'users': users_list}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()