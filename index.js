const puppeteer = require('puppeteer');
const CREDS = require('./creds');

async function run() {
	const browser = await puppeteer.launch ({
		headless: false
	});

	const page = await browser.newPage();

	// set larger browser height so that the max of 10 results is shown per page
	page.setViewport({ width: 1280, height: 1200 });

	await page.goto('https://www.linkedin.com/login?trk=guest_homepage-basic_nav-header-signin');

	const EMAIL_SELECTOR = '#username';
	const PASSWORD_SELECTOR = '#password';
	const BUTTON_SELECTOR = '#app__container > main > div > form > div.login__form_action_container > button';

	await page.click(EMAIL_SELECTOR);
	await page.keyboard.type(CREDS.linkedin);

	await page.click(PASSWORD_SELECTOR);
	await page.keyboard.type(CREDS.password);

	await page.click(BUTTON_SELECTOR);

	await page.waitForNavigation;

	const titleToSearch = 'business%20development%20manager';
	// const geoToSearch = 'gb'

	const searchURL = `https://www.linkedin.com/search/results/people/?facetGeoRegion=%5B%22gb%3A0%22%5D&facetIndustry=%5B%2298%22%5D&facetProfileLanguage=%5B%22en%22%5D&origin=FACETED_SEARCH&title=${titleToSearch}`

	// Set up CSV file
	const createCsvWriter = require('csv-writer').createObjectCsvWriter;
	const csvWriter = createCsvWriter({
		path: './csv/prospects.csv',
		header: [
			{id: 'firstName', title: 'First name'},
			{id: 'lastName', title: 'Last name'},
			{id: 'company', title: 'Company'},
			{id: 'title', title: 'Title'},
			{id: 'location', title: 'Location'},
			{id: 'profileLink', title: 'Profile link'},
			{id: 'role', title: 'Role'}
		]
	});

	// Loop through 100 pages of LinkedIn results
	// note will error if less than 100 pages
	for (let h = 1; h <= 74; h++) {

		let pageURL = searchURL + '&page=' + h;
		await page.goto(pageURL);
		await page.waitFor(10*1000);


		const prospects = await page.evaluate(() => {
			// a helper function to find the right selector for the right text and remove trailing whitespace in each row
			const grabFromRow = (row, classname) => row
				.querySelector(classname)
				.innerText
				.trim();


			// this is the class that defines a single prospect
			const PROSPECT_SELECTOR_CLASS = '.search-result--person';

			// other selector classes
			const LIST_NAME_SELECTOR = '.actor-name';
			const LIST_TITLE_SELECTOR = '.subline-level-1';
			const LIST_LOCATION_SELECTOR = '.subline-level-2';
			const LIST_PROFILE_LINK_SELECTOR = '.search-result__result-link';


			// store data in array of objects
			const data = []

			// get all prospect rows
			const prospectRows = document.querySelectorAll(PROSPECT_SELECTOR_CLASS)

			// Helper function to separate out company name if available
			function checkForCompanyName(title) {
				if (title.includes(" at ")) {
					var role = title.split(" at ")[0];
					var company = title.split(" at ")[1].replace(",", "");
				} else {
					var role = title;
				}

				return { role: role, company: company	}
			}

			// loop over each prospect row and create objects
			for (const row of prospectRows) {

				let title = grabFromRow(row, LIST_TITLE_SELECTOR);
				let splitName = grabFromRow(row, LIST_NAME_SELECTOR).split(' ');
				let profileLink = 'https://www.linkedin.com' + row.querySelector(LIST_PROFILE_LINK_SELECTOR).getAttribute('href');
				let company = checkForCompanyName(title).company;

				data.push({
					firstName: splitName.shift(),
					lastName: splitName.join(' ').replace(",", ""),
					profileLink: profileLink,
					company: company,
					title: title,
					location: grabFromRow(row, LIST_LOCATION_SELECTOR),
					role: checkForCompanyName(title).role
				})

			}

			return data
		})

		async function getCompanyNameFromProfile(browser, profileLink) {
			const profilePage = await browser.newPage();
			await profilePage.goto(profileLink);

			let companyName = await profilePage.evaluate(() => {
				const COMPANY_SELECTOR = '.lt-line-clamp'
				return document.querySelectorAll(COMPANY_SELECTOR)[0].innerText.replace(",", "");
			});

			await profilePage.close();

			return companyName;
		}

		const prospectsWithCompanies = await Promise.all(prospects.map(async prospect => {
			if(prospect.company) return prospect

			try {

				const company = await getCompanyNameFromProfile(browser, prospect.profileLink)
				return { ...prospect, company }

			} catch (error) {

				console.log(error);
				return prospect;

			}
		}))

		csvWriter
			.writeRecords(prospectsWithCompanies)
			.then(() => console.log('Page' + h + ': CSV written successfully'));
	}

	await browser.close();
}

run();