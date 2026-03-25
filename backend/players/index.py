import json
import os
import psycopg2
from datetime import datetime, timedelta

def handler(event: dict, context) -> dict:
    '''API для получения списка всех игроков и статистики сводки'''
    
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

    params = event.get('queryStringParameters') or {}
    mode = params.get('mode', '')

    conn = None
    try:
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        schema = 't_p45110186_greeting_project_202'

        if mode == 'stats':
            cursor.execute(f"SELECT COUNT(*) FROM {schema}.users WHERE last_login_at >= NOW() - INTERVAL '5 minutes'")
            online_count = cursor.fetchone()[0]

            cursor.execute(f"SELECT COUNT(*) FROM {schema}.users")
            total_users = cursor.fetchone()[0]

            cursor.execute(f"SELECT COUNT(*) FROM {schema}.users WHERE created_at >= CURRENT_DATE")
            today_registrations = cursor.fetchone()[0]

            cursor.execute(f"SELECT COUNT(*) FROM {schema}.users WHERE last_login_at >= CURRENT_DATE")
            active_today = cursor.fetchone()[0]

            cursor.execute(f'''
                SELECT DATE(created_at) as day, COUNT(*) as cnt
                FROM {schema}.users
                WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
                GROUP BY DATE(created_at)
                ORDER BY day ASC
            ''')
            rows = cursor.fetchall()
            today = datetime.utcnow().date()
            day_map = {row[0]: row[1] for row in rows}
            chart = []
            for i in range(6, -1, -1):
                d = today - timedelta(days=i)
                chart.append({'date': d.strftime('%d.%m'), 'count': day_map.get(d, 0)})

            cursor.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'online': online_count,
                    'totalUsers': total_users,
                    'todayRegistrations': today_registrations,
                    'activeToday': active_today,
                    'chart': chart
                }),
                'isBase64Encoded': False
            }
        
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