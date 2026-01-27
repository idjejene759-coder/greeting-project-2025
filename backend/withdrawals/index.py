import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    """API для управления заявками на вывод средств"""
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            status_filter = params.get('status', 'pending')
            
            cursor.execute("""
                SELECT id, user_id, username, amount, network, wallet_address, status, 
                       created_at, processed_at, admin_note
                FROM t_p45110186_greeting_project_202.withdrawal_requests
                WHERE status = %s
                ORDER BY created_at DESC
            """, (status_filter,))
            rows = cursor.fetchall()
            
            withdrawals = []
            for row in rows:
                withdrawals.append({
                    'id': row[0],
                    'userId': row[1],
                    'username': row[2],
                    'amount': float(row[3]),
                    'network': row[4],
                    'walletAddress': row[5],
                    'status': row[6],
                    'createdAt': row[7].isoformat() if row[7] else None,
                    'processedAt': row[8].isoformat() if row[8] else None,
                    'adminNote': row[9]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'withdrawals': withdrawals}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            username = body.get('username')
            amount = body.get('amount')
            network = body.get('network')
            wallet_address = body.get('walletAddress')
            
            if not all([user_id, username, amount, network, wallet_address]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            if amount < 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Минимальная сумма вывода 10 USDT'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT balance FROM t_p45110186_greeting_project_202.users
                WHERE id = %s
            """, (user_id,))
            
            result = cursor.fetchone()
            if not result or result[0] < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                INSERT INTO t_p45110186_greeting_project_202.withdrawal_requests
                (user_id, username, amount, network, wallet_address, status)
                VALUES (%s, %s, %s, %s, %s, 'pending')
                RETURNING id
            """, (user_id, username, amount, network, wallet_address))
            
            withdrawal_id = cursor.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Заявка подана администратору',
                    'withdrawalId': withdrawal_id
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            withdrawal_id = body.get('withdrawalId')
            action = body.get('action')
            admin_note = body.get('adminNote', '')
            
            if not withdrawal_id or action not in ['approve', 'reject']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid request'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT user_id, amount, status 
                FROM t_p45110186_greeting_project_202.withdrawal_requests
                WHERE id = %s
            """, (withdrawal_id,))
            result = cursor.fetchone()
            
            if not result or result[2] != 'pending':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Request not found or already processed'}),
                    'isBase64Encoded': False
                }
            
            user_id, amount = result[0], result[1]
            
            if action == 'approve':
                cursor.execute("""
                    UPDATE t_p45110186_greeting_project_202.users
                    SET balance = balance - %s
                    WHERE id = %s
                """, (amount, user_id))
                
                cursor.execute("""
                    UPDATE t_p45110186_greeting_project_202.withdrawal_requests
                    SET status = 'approved', processed_at = %s, admin_note = %s
                    WHERE id = %s
                """, (datetime.now(), admin_note, withdrawal_id))
            else:
                cursor.execute("""
                    UPDATE t_p45110186_greeting_project_202.withdrawal_requests
                    SET status = 'rejected', processed_at = %s, admin_note = %s
                    WHERE id = %s
                """, (datetime.now(), admin_note, withdrawal_id))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Статус обновлён'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            body = json.loads(event.get('body', '{}'))
            withdrawal_id = body.get('withdrawalId')
            
            if not withdrawal_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Missing withdrawalId'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT status FROM t_p45110186_greeting_project_202.withdrawals
                WHERE id = %s
            """, (withdrawal_id,))
            result = cursor.fetchone()
            
            if not result:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заявка не найдена'}),
                    'isBase64Encoded': False
                }
            
            if result[0] == 'pending':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нельзя удалить заявку со статусом "В ожидании"'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                DELETE FROM t_p45110186_greeting_project_202.withdrawals
                WHERE id = %s
            """, (withdrawal_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Заявка удалена'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cursor.close()
        conn.close()