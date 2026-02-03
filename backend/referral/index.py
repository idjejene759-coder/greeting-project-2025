import json
import os
import psycopg2
from datetime import datetime

def handler(event: dict, context) -> dict:
    '''API для реферальной системы и вывода средств из реферальной программы'''
    
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
    
    dsn = os.environ.get('DATABASE_URL')
    schema = 't_p45110186_greeting_project_202'
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            # Реферальная система
            if action == 'track_click':
                ref_user_id = body.get('refUserId')
                
                if not ref_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'refUserId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"UPDATE {schema}.users SET referral_clicks = referral_clicks + 1 WHERE id = %s", (ref_user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Click tracked'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'track_registration':
                ref_user_id = body.get('refUserId')
                new_user_id = body.get('newUserId')
                
                if not ref_user_id or not new_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'refUserId and newUserId required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT id FROM {schema}.users WHERE id = %s", (ref_user_id,))
                if cur.fetchone():
                    cur.execute(f"UPDATE {schema}.users SET referral_registrations = referral_registrations + 1, referral_count = referral_count + 1 WHERE id = %s", (ref_user_id,))
                    cur.execute(f"UPDATE {schema}.users SET referred_by = %s WHERE id = %s", (ref_user_id, new_user_id))
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Registration tracked'}),
                        'isBase64Encoded': False
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Referrer not found'}),
                        'isBase64Encoded': False
                    }
            
            # Создание заявки на вывод из реферальной программы
            else:
                withdrawal_type = body.get('type')
                user_id = body.get('userId')
                username = body.get('username')
                amount = float(body.get('amount'))
                crypto_type = body.get('cryptoType')
                network = body.get('network')
                wallet_address = body.get('walletAddress')
                
                if not all([user_id, username, amount, crypto_type, wallet_address]):
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
                        'body': json.dumps({'error': 'Минимальная сумма вывода 10$'}),
                        'isBase64Encoded': False
                    }
                
                # Проверка доступного баланса
                cur.execute(f"""
                    SELECT referral_registrations * 0.5 - COALESCE(
                        (SELECT SUM(amount) FROM {schema}.referral_withdrawal_requests 
                         WHERE user_id = %s AND status IN ('pending', 'approved')), 0
                    ) as available_balance
                    FROM {schema}.users WHERE id = %s
                """, (user_id, user_id))
                
                result = cur.fetchone()
                if not result or result[0] < amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Недостаточно средств'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    INSERT INTO {schema}.referral_withdrawal_requests
                    (user_id, username, amount, crypto_type, network, wallet_address, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                    RETURNING id
                """, (user_id, username, amount, crypto_type, network or crypto_type, wallet_address))
                
                withdrawal_id = cur.fetchone()[0]
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
        
        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            user_id = query_params.get('userId')
            request_type = query_params.get('type')
            
            # Получение заявок на вывод
            if request_type == 'withdrawals':
                status_filter = query_params.get('status', 'pending')
                
                if user_id:
                    cur.execute(f"""
                        SELECT id, amount, crypto_type, network, wallet_address, status, 
                               created_at, processed_at, admin_note
                        FROM {schema}.referral_withdrawal_requests
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                    """, (user_id,))
                else:
                    cur.execute(f"""
                        SELECT id, user_id, username, amount, crypto_type, network, 
                               wallet_address, status, created_at, processed_at, admin_note
                        FROM {schema}.referral_withdrawal_requests
                        WHERE status = %s
                        ORDER BY created_at DESC
                    """, (status_filter,))
                
                rows = cur.fetchall()
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
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'withdrawals': withdrawals}),
                    'isBase64Encoded': False
                }
            
            # Получение реферальной статистики
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT referral_clicks, referral_registrations, referral_count FROM {schema}.users WHERE id = %s", (user_id,))
            result = cur.fetchone()
            
            if result:
                # Расчет заблокированной суммы (pending + approved заявки)
                cur.execute(f"""
                    SELECT COALESCE(SUM(amount), 0) 
                    FROM {schema}.referral_withdrawal_requests
                    WHERE user_id = %s AND status IN ('pending', 'approved')
                """, (user_id,))
                pending_amount = float(cur.fetchone()[0])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'clicks': result[0] or 0,
                        'registrations': result[1] or 0,
                        'deposits': result[2] or 0,
                        'pendingAmount': pending_amount
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'}),
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
            
            cur.execute(f"""
                SELECT user_id, amount, status 
                FROM {schema}.referral_withdrawal_requests
                WHERE id = %s
            """, (withdrawal_id,))
            result = cur.fetchone()
            
            if not result or result[2] != 'pending':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                    'isBase64Encoded': False
                }
            
            if action == 'approve':
                cur.execute(f"""
                    UPDATE {schema}.referral_withdrawal_requests
                    SET status = 'approved', processed_at = %s, admin_note = %s
                    WHERE id = %s
                """, (datetime.now(), admin_note, withdrawal_id))
            else:
                # При отклонении средства не вернутся - они просто не были списаны
                # Статус rejected означает что заявка отклонена, средства доступны для нового вывода
                cur.execute(f"""
                    UPDATE {schema}.referral_withdrawal_requests
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
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()