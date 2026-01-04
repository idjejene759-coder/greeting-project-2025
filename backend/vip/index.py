import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление VIP-доступом: создание заявок, проверка статуса, одобрение/отклонение админом
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
                
                cur.execute(
                    "SELECT id FROM vip_requests WHERE user_id = %s AND status = 'pending'",
                    (user_id,)
                )
                existing = cur.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'У вас уже есть активная заявка на VIP'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "INSERT INTO vip_requests (user_id, payment_screenshot_url, status) VALUES (%s, %s, 'pending') RETURNING id",
                    (user_id, screenshot_url)
                )
                request_id = cur.fetchone()[0]
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
                
                cur.execute(
                    "SELECT is_vip, vip_expires_at FROM users WHERE id = %s",
                    (user_id,)
                )
                user = cur.fetchone()
                
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
                
                cur.execute(
                    "SELECT status FROM vip_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                    (user_id,)
                )
                request = cur.fetchone()
                
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
                
                cur.execute(
                    "SELECT user_id FROM vip_requests WHERE id = %s AND status = 'pending'",
                    (request_id,)
                )
                request = cur.fetchone()
                
                if not request:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                        'isBase64Encoded': False
                    }
                
                user_id = request[0]
                vip_expires = datetime.now() + timedelta(days=30)
                
                cur.execute(
                    "UPDATE users SET is_vip = TRUE, vip_expires_at = %s WHERE id = %s",
                    (vip_expires, user_id)
                )
                
                cur.execute(
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
                
                cur.execute(
                    "UPDATE vip_requests SET status = 'rejected', processed_at = CURRENT_TIMESTAMP, processed_by_admin_id = %s WHERE id = %s AND status = 'pending' RETURNING id",
                    (admin_id, request_id)
                )
                result = cur.fetchone()
                conn.commit()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message': 'Заявка отклонена'
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            action = query_params.get('action')
            
            if action == 'list_requests':
                status_filter = query_params.get('status', 'pending')
                
                cur.execute(
                    """
                    SELECT vr.id, vr.user_id, u.username, vr.payment_screenshot_url, 
                           vr.status, vr.created_at, vr.processed_at
                    FROM vip_requests vr
                    JOIN users u ON vr.user_id = u.id
                    WHERE vr.status = %s
                    ORDER BY vr.created_at DESC
                    """,
                    (status_filter,)
                )
                
                requests = []
                for row in cur.fetchall():
                    requests.append({
                        'id': row[0],
                        'userId': row[1],
                        'username': row[2],
                        'screenshotUrl': row[3],
                        'status': row[4],
                        'createdAt': row[5].isoformat() if row[5] else None,
                        'processedAt': row[6].isoformat() if row[6] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'requests': requests}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неизвестное действие'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()
