import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для получения списка игроков и управления VIP-доступом'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        
        # VIP функционал (POST запросы)
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create_request':
                user_id = body_data.get('userId')
                screenshot_url = (body_data.get('screenshotUrl') or '').strip()
                
                if not user_id or not screenshot_url:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя и скриншот обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT id FROM vip_requests WHERE user_id = %s AND status = 'pending'",
                    (user_id,)
                )
                existing = cursor.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'У вас уже есть активная заявка на VIP'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "INSERT INTO vip_requests (user_id, payment_screenshot_url, status) VALUES (%s, %s, 'pending') RETURNING id",
                    (user_id, screenshot_url)
                )
                request_id = cursor.fetchone()[0]
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Заявка отправлена! Ожидайте подтверждения администратора.',
                        'requestId': request_id
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'check_status':
                user_id = body_data.get('userId')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID пользователя обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT is_vip, vip_expires_at FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cursor.fetchone()
                
                if not user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                is_vip = user[0]
                vip_expires_at = user[1]
                
                if is_vip and vip_expires_at:
                    expires_at_str = vip_expires_at.isoformat() if isinstance(vip_expires_at, datetime) else str(vip_expires_at)
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'isVip': True,
                            'expiresAt': expires_at_str
                        }),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT status FROM vip_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                    (user_id,)
                )
                request = cursor.fetchone()
                
                request_status = request[0] if request else None
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'isVip': False,
                        'requestStatus': request_status
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'approve':
                request_id = body_data.get('requestId')
                admin_id = body_data.get('adminId')
                
                if not request_id or not admin_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID заявки и админа обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "SELECT user_id FROM vip_requests WHERE id = %s AND status = 'pending'",
                    (request_id,)
                )
                request = cursor.fetchone()
                
                if not request:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                        'isBase64Encoded': False
                    }
                
                user_id = request[0]
                vip_expires = datetime.now() + timedelta(days=30)
                
                cursor.execute(
                    "UPDATE users SET is_vip = TRUE, vip_expires_at = %s WHERE id = %s",
                    (vip_expires, user_id)
                )
                
                cursor.execute(
                    "UPDATE vip_requests SET status = 'approved', processed_at = CURRENT_TIMESTAMP, processed_by_admin_id = %s WHERE id = %s",
                    (admin_id, request_id)
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'VIP-доступ активирован на 30 дней'
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'reject':
                request_id = body_data.get('requestId')
                admin_id = body_data.get('adminId')
                
                if not request_id or not admin_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID заявки и админа обязательны'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(
                    "UPDATE vip_requests SET status = 'rejected', processed_at = CURRENT_TIMESTAMP, processed_by_admin_id = %s WHERE id = %s AND status = 'pending'",
                    (admin_id, request_id)
                )
                
                if cursor.rowcount == 0:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                        'isBase64Encoded': False
                    }
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Заявка отклонена'
                    }),
                    'isBase64Encoded': False
                }
        
        # Получение списка игроков или VIP заявок (GET запросы)
        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            request_type = query_params.get('type')
            
            if request_type == 'vip_requests':
                status_filter = query_params.get('status', 'pending')
                
                cursor.execute('''
                    SELECT 
                        vr.id,
                        vr.user_id,
                        u.username,
                        vr.payment_screenshot_url,
                        vr.status,
                        vr.created_at,
                        vr.processed_at
                    FROM vip_requests vr
                    JOIN users u ON vr.user_id = u.id
                    WHERE vr.status = %s
                    ORDER BY vr.created_at DESC
                ''', (status_filter,))
                
                rows = cursor.fetchall()
                requests = []
                
                for row in rows:
                    requests.append({
                        'id': row[0],
                        'userId': row[1],
                        'username': row[2],
                        'screenshotUrl': row[3],
                        'status': row[4],
                        'createdAt': row[5].isoformat() if row[5] else None,
                        'processedAt': row[6].isoformat() if row[6] else None
                    })
                
                cursor.close()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'requests': requests}),
                    'isBase64Encoded': False
                }
            
            # По умолчанию - список игроков
            cursor.execute('''
                SELECT 
                    id,
                    username,
                    balance,
                    referral_count,
                    created_at,
                    is_banned,
                    ban_reason,
                    is_vip,
                    vip_expires_at,
                    telegram_username,
                    last_login_at
                FROM t_p45110186_greeting_project_202.users
                ORDER BY created_at DESC
            ''')
            
            rows = cursor.fetchall()
            
            result = []
            for row in rows:
                result.append({
                    'id': row[0],
                    'username': row[1],
                    'balance': row[2] or 0,
                    'referralCount': row[3] or 0,
                    'createdAt': row[4].isoformat() if row[4] else None,
                    'isBanned': row[5] or False,
                    'banReason': row[6],
                    'isVip': row[7] or False,
                    'vipExpiresAt': row[8].isoformat() if row[8] else None,
                    'telegramUsername': row[9],
                    'lastLoginAt': row[10].isoformat() if row[10] else None
                })
            
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'players': result}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()
