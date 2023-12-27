import { all_tickers } from './tickers.js';
import {loginIG} from './login_ig.js';
import {isMarketOpen} from './is_market_open.js';

export async function processRequest(request, env, ctx) {

	const { CST, X_SECURITY_TOKEN } = await loginIG(env);

	// Check if the nasdaq 100 is open & exit if not
	const marketStatus = await isMarketOpen(env, CST, X_SECURITY_TOKEN);
	if (marketStatus === "EDITS_ONLY") {
		return;
	}

	// Create a copy of all_tickers array to update with the price/sentiment data
	let updatedTickers = [...all_tickers];

	// Create a map for quick access
	let tickerMap = new Map();
	updatedTickers.forEach(ticker => {
		tickerMap.set(ticker.epic, ticker);
		tickerMap.set(ticker.marketId, ticker);
	});

	// PRICE DATA SECTION

	// Extract all epics from the all_tickers array and join them with '%2C' (comma encoded)
	const epics = updatedTickers.map(ticker => ticker.epic).join('%2C');

	// Fetch the market details for all epics
	const marketDetailsResponse = await fetch(`https://api.ig.com/gateway/deal/markets?epics=${epics}&filter=SNAPSHOT_ONLY`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-IG-API-KEY': env.IG_API_KEY,
			'CST': CST,
			'X-SECURITY-TOKEN': X_SECURITY_TOKEN
		}
	});

	const marketDetailsData = await marketDetailsResponse.json();

	// Update each object in updatedTickersarray with price value from corresponding object in response
	marketDetailsData.marketDetails.forEach(detail => {
		let ticker = tickerMap.get(detail.instrument.epic);
		if (ticker) {
			ticker.price = parseFloat((detail.snapshot.bid - ((detail.snapshot.bid - detail.snapshot.offer) / 2)).toFixed(2));
		}
	});

	// SENTIMENT DATA SECTION

	// Extract all epics from the all_tickers array and join them with '%2C' (comma encoded)
	const marketIDs = updatedTickers.map(ticker => ticker.marketId).join('%2C');

	// Fetch the market details for all epics
	const sentimentDataResponse = await fetch(`https://api.ig.com/gateway/deal/clientsentiment?marketIds=${marketIDs}`, {
		method: 'GET',
		headers: {
			'Content-Type': 'application/json',
			'X-IG-API-KEY': env.IG_API_KEY,
			'CST': CST,
			'X-SECURITY-TOKEN': X_SECURITY_TOKEN
		}
	});

	const sentimentData = await sentimentDataResponse.json();

	// Update each object with the longPositionPercentage value
	sentimentData.clientSentiments.forEach(market => {
		let ticker = tickerMap.get(market.marketId);
		if (ticker) {
			ticker.longPositionPercentage = market.longPositionPercentage;
		}
	});

	// DATABASE SECTION

	// Create date object for if want to do a one-off entry into the DB
	//const specificDate = new Date('2023-11-24T21:00:00Z');
	//const unixTime = specificDate.getTime();

	// Start a db transaction
	const begin = env.DB.prepare("BEGIN");
	const commit = env.DB.prepare("COMMIT");
	const rollback = env.DB.prepare("ROLLBACK");

	// Start a transaction
	begin.run();

	

	try {
		for (let ticker of updatedTickers) {
			let tableName = ticker.marketId.replace(/-/g, '');
			const stmt = await env.DB.prepare(`INSERT INTO ${tableName} (unixTime, price, longPositionPercentage) VALUES (?, ?, ?)`);
			await stmt.bind(Math.floor(Date.now() / 1000), ticker.price, ticker.longPositionPercentage).run();
		}
		// If all operations were successful, commit the transaction
		commit.run();
	} catch (err) {
		// If any operation failed, rollback the transaction
		rollback.run();
		throw err;
	}

	// Log the updated tickers used to update the database
	//console.log(JSON.stringify(updatedTickers, null, 2));

}