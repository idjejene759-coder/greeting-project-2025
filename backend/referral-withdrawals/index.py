import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для управления заявками на вывод из реферальной программы'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
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
            status_filter = params.get('status', 'pending')
            user_id = params.get('userId')
            
            if user_id:
                cursor.execute("""
                    SELECT id, amount, crypto_type, network, wallet_address, status, 
                           created_at, processed_at, admin_note
                    FROM t_p45110186_greeting_project_202.referral_withdrawal_requests
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                """, (user_id,))
            else:
                cursor.execute("""
                    SELECT id, user_id, username, amount, crypto_type, network, 
                           wallet_address, status, created_at, processed_at, admin_note
                    FROM t_p45110186_greeting_project_202.referral_withdrawal_requests
                    WHERE status = %s
                    ORDER BY created_at DESC
                """, (status_filter,))
            
            rows = cursor.fetchall()
            withdrawals = []
            
            for row in rows:
                if user_id:
                    withdrawals.append({
                        'id': row[0],
                        'amount': float(row[1]),
                        'cryptoType': row[2],
                        'network': row[3],
                        'walletAddress': row[4],
                        'status': row[5],
                        'createdAt': row[6].isoformat() if row[6] else None,
                        'processedAt': row[7].isoformat() if row[7] else None,
                        'adminNote': row[8]
                    })
                else:
                    withdrawals.append({
                        'id': row[0],
                        'userId': row[1],
                        'username': row[2],
                        'amount': float(row[3]),
                        'cryptoType': row[4],
                        'network': row[5],
                        'walletAddress': row[6],
                        'status': row[7],
                        'createdAt': row[8].isoformat() if row[8] else None,
                        'processedAt': row[9].isoformat() if row[9] else None,
                        'adminNote': row[10]
                    })
            
            cursor.close()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'withdrawals': withdrawals}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            username = body.get('username')
            amount = float(body.get('amount'))
            crypto_type = body.get('cryptoType')
            network = body.get('network')
            wallet_address = body.get('walletAddress')
            
            if not all([user_id, username, amount, crypto_type, wallet_address]):
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Missing required fields'}),
                    'isBase64Encoded': False
                }
            
            if amount < 10:
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Минимальная сумма вывода 10$'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                INSERT INTO t_p45110186_greeting_project_202.referral_withdrawal_requests
                (user_id, username, amount, crypto_type, network, wallet_address, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                RETURNING id
            """, (user_id, username, amount, crypto_type, network or crypto_type, wallet_address))
            
            withdrawal_id = cursor.fetchone()[0]
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
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
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Invalid request'}),
                    'isBase64Encoded': False
                }
            
            cursor.execute("""
                SELECT user_id, amount, status 
                FROM t_p45110186_greeting_project_202.referral_withdrawal_requests
                WHERE id = %s
            """, (withdrawal_id,))
            result = cursor.fetchone()
            
            if not result or result[2] != 'pending':
                cursor.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                    'isBase64Encoded': False
                }
            
            user_id, amount = result[0], result[1]
            
            if action == 'approve':
                cursor.execute("""
                    UPDATE t_p45110186_greeting_project_202.referral_withdrawal_requests
                    SET status = 'approved', processed_at = %s, admin_note = %s
                    WHERE id = %s
                """, (datetime.now(), admin_note, withdrawal_id))
            else:
                cursor.execute("""
                    UPDATE t_p45110186_greeting_project_202.referral_withdrawal_requests
                    SET status = 'rejected', processed_at = %s, admin_note = %s
                    WHERE id = %s
                """, (datetime.now(), admin_note, withdrawal_id))
            
            conn.commit()
            cursor.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Статус обновлён'}),
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
