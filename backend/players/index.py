import json
import os
import psycopg2

def handler(event: dict, context) -> dict:
    '''API для получения списка всех игроков'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    conn = None
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        
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