import json
import os
import psycopg2
from urllib.parse import parse_qs

def handler(event: dict, context) -> dict:
    '''API для отслеживания реферальных переходов и получения статистики'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': ''
        }
    
    dsn = os.environ.get('DATABASE_URL')
    schema = 't_p45110186_greeting_project_202'
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'track_click':
                ref_user_id = body.get('refUserId')
                visitor_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', '')
                
                if not ref_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'refUserId required'})
                    }
                
                cur.execute(f"UPDATE {schema}.users SET referral_clicks = referral_clicks + 1 WHERE id = %s", (ref_user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Click tracked'})
                }
            
            elif action == 'track_registration':
                ref_user_id = body.get('refUserId')
                new_user_id = body.get('newUserId')
                
                if not ref_user_id or not new_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'refUserId and newUserId required'})
                    }
                
                cur.execute(f"SELECT id FROM {schema}.users WHERE id = %s", (ref_user_id,))
                if cur.fetchone():
                    cur.execute(f"UPDATE {schema}.users SET referral_registrations = referral_registrations + 1, referral_count = referral_count + 1 WHERE id = %s", (ref_user_id,))
                    
                    cur.execute(f"UPDATE {schema}.users SET referred_by = %s WHERE id = %s", (ref_user_id, new_user_id))
                    
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Registration tracked'})
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Referrer not found'})
                    }
        
        elif method == 'GET':
            query_params = event.get('queryStringParameters') or {}
            user_id = query_params.get('userId')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'userId required'})
                }
            
            cur.execute(f"SELECT referral_clicks, referral_registrations, referral_count FROM {schema}.users WHERE id = %s", (user_id,))
            result = cur.fetchone()
            
            if result:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'clicks': result[0] or 0,
                        'registrations': result[1] or 0,
                        'deposits': result[2] or 0
                    })
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'User not found'})
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
