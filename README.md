# ADS-Metrics-Cloudflare-Worker
A lightweight Cloudflare Worker that dynamically fetches publication metrics (paper count, total citations, and h-index) from a NASA ADS library. It caches results in memory for 24 hours to minimize API usage and deliver instant responses for your website or API integrations.

# ADS Metrics Cloudflare Worker

A lightweight [Cloudflare Worker](https://developers.cloudflare.com/workers/) that dynamically fetches your **NASA ADS** publication metrics — including paper count, total citations, and h-index — and serves them as a simple JSON API.  

The worker caches results in memory for 24 hours to minimize API calls and ensure fast responses for your website or other integrations.

---

## Features

- 🔍 Fetches all papers from a specified **NASA ADS library**
- 📊 Aggregates citation data for each paper
- 🧮 Calculates **total citations** and **h-index**
- ⚡ Caches results in-memory for **24 hours** (no external KV storage required)
- 🧠 Returns clean JSON output in the format:

```json
{"papers":20,"citations":852,"h_index":14}
```
## Setup instructions

- Upload the worker to the Cloudflare.
- Create the ADS library with the papers of your interest
- Get the ADS API token and the library ID from the ADS Settings
- Add your ADS API and library ID as the secrets (enviromental variables) of the worker:

```python
ADS_TOKEN = "your_ads_api_token"
LIB_ID = "your_ads_library_id"
```
- Deploy the worken on Cloudflare
