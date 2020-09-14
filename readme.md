# LinkedIn Scraper using Puppeteer (and Chromium)

This is a quick and dirty script for scraping LinkedIn contacts quickly, for sales lead generation. It also allowed me to learn Puppeteer.

## Requirements
- Dependencies:
  - `convert-csv-to-json`
  - `csv-parser`
  - `csv-writer`
  - `node-fetch`
  - `puppeteer`
- You'll need to have a LinkedIn account. Proceed at your own risk (LinkedIn may ban your account).
- You'll also need a [Cognism](https://cognism.com) account and API key.

## Get started
- Download repo and run `node install`.

## Instruction for how to get a list of prospects from LinkedIn, complete with emails from Cognism.

1. Make sure ```creds.js``` is using the right LinkedIn login details.
2. Amend LinkedIn search params as needed within ```index.js``` (rows 30-31).
3. In console, run ```node index.js```. Results will be written to csv/prospects.csv. If there are less than 100 LinkedIn pages of results, there will be an error.

## To improve

- Use cases where search results come back with less than 100 pages.