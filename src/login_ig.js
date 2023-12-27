export async function loginIG(env) {
    const loginResponse = await fetch('https://api.ig.com/gateway/deal/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-IG-API-KEY': env.IG_API_KEY,
            'Version': '2'
        },
        body: JSON.stringify({
            identifier: env.IG_IDENTIFIER,
            password: env.IG_PASSWORD,
        })
    });

    if (!loginResponse.ok) {
        throw new Error(`Login failed with status: ${loginResponse.status}`);
    }

    const CST = loginResponse.headers.get('CST');
    const X_SECURITY_TOKEN = loginResponse.headers.get('X-SECURITY-TOKEN');

    return { CST, X_SECURITY_TOKEN };
}