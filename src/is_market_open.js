export async function isMarketOpen(env, CST, X_SECURITY_TOKEN) {
    
    const response = await fetch(`https://api.ig.com/gateway/deal/markets/IX.D.NASDAQ.CASH.IP`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-IG-API-KEY': env.IG_API_KEY,
			'CST': CST,
            'version': '3',
			'X-SECURITY-TOKEN': X_SECURITY_TOKEN
		}
	});

    if (!response.ok) {
        throw new Error(`The check for market open failed with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.snapshot || !data.snapshot.marketStatus) {
        throw new Error('Unexpected API response structure');
    }

    return data.snapshot.marketStatus;

}