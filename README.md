# ig-trading-sentiment-cloudflare-worker

Javascript Cloudflare worker which gets sentiment and price data (for different markets) from the IG Trading API every 2 hours during UK & US trading hours.

The data is then written to a Cloudflare D1 serverless database.

Used Cloudflare Worker/D1 database because the usage falls well within their free tiers so the project is free to run.
