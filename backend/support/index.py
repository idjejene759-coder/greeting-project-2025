import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для работы с чатом поддержки'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            user_id = params.get('userId')
            is_admin = params.get('isAdmin') == 'true'
            
            if is_admin:
                cursor.execute('''
                    SELECT DISTINCT ON (user_id)
                        sm.user_id,
                        sm.username,
                        sm.message,
                        sm.created_at,
                        (SELECT COUNT(*) FROM t_p45110186_greeting_project_202.support_messages 
                         WHERE user_id = sm.user_id AND is_read = false AND is_admin_reply = false) as unread_count
                    FROM t_p45110186_greeting_project_202.support_messages sm
                    ORDER BY user_id, created_at DESC
                ''')
                
                rows = cursor.fetchall()
                result = []
                for row in rows:
                    result.append({
                        'userId': row[0],
                        'username': row[1],
                        'lastMessage': row[2],
                        'lastMessageTime': row[3].isoformat() if row[3] else None,
                        'unreadCount': row[4] or 0
                    })
                
                cursor.close()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'chats': result}),
                    'isBase64Encoded': False
                }
                
            elif user_id:
                cursor.execute('''
                    SELECT 
                        id,
                        message,
                        is_admin_reply,
                        admin_username,
                        created_at
                    FROM t_p45110186_greeting_project_202.support_messages
                    WHERE user_id = %s
                    ORDER BY created_at ASC
                ''', (user_id,))
                
                rows = cursor.fetchall()
                result = []
                for row in rows:
                    result.append({
                        'id': row[0],
                        'message': row[1],
                        'isAdminReply': row[2] or False,
                        'adminUsername': row[3],
                        'createdAt': row[4].isoformat() if row[4] else None
                    })
                
                cursor.execute('''
                    UPDATE t_p45110186_greeting_project_202.support_messages
                    SET is_read = true
                    WHERE user_id = %s AND is_admin_reply = true
                ''', (user_id,))
                conn.commit()
                
                cursor.close()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'messages': result}),
                    'isBase64Encoded': False
                }
            else:
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'userId or isAdmin parameter required'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            username = body.get('username')
            message = body.get('message')
            is_admin_reply = body.get('isAdminReply', False)
            admin_username = body.get('adminUsername')
            
            if not user_id or not username or not message:
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'userId, username and message are required'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute('''
                INSERT INTO t_p45110186_greeting_project_202.support_messages
                (user_id, username, message, is_admin_reply, admin_username)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, created_at
            ''', (user_id, username, message, is_admin_reply, admin_username))
            
            result = cursor.fetchone()
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'id': result[0],
                    'createdAt': result[1].isoformat()
                }),
                'isBase64Encoded': False
            }
        
        else:
            cursor.close()
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
        if conn:
            conn.rollback()
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
