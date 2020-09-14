const http = require("https");
const fetch = require("node-fetch");

async function run() {

  // Set up CSV file
  const createCsvWriter = require('csv-writer').createObjectCsvWriter;
  const csvWriter = createCsvWriter({
    path: './csv/emails.csv',
    header: [
      {id: 'firstName', title: 'Firstname'},
      {id: 'lastName', title: 'Lastname'},
      {id: 'company', title: 'Company'},
      {id: 'email', title: 'Email'}
    ]
  });

  async function getEmail(firstName, lastName, company){
    const formattedFirstName = encodeURIComponent(firstName);
    const formattedLastName = encodeURIComponent(lastName);
    const formattedCompany = encodeURIComponent(company);

    const response = await fetch(`https://api.cognism.com/api/email?company=${ formattedCompany }&lastName=${ formattedLastName }&firstName=${ formattedFirstName }&api_key=TO_FILL_IN`)

    return response.json()
  }

  const sleep = millis => new Promise(res => setTimeout(res, millis))

  // Read existing prospects file
  let csvToJson = require('convert-csv-to-json');
  let prospectsJson = csvToJson.fieldDelimiter(',').getJsonFromCsv("./csv/prospects.csv");

  for (const prospect of prospectsJson) {
    await sleep(1000);

    if (prospect['Company'].toLowerCase() == 'self-employed') { 

      const emailObject = {
        firstName: prospect['Firstname'],
        lastName: prospect['Lastname'],
        company: prospect['Company']
      }

      await csvWriter.writeRecords([emailObject])

      continue;
      
    } else {

      try {

        const email = await getEmail(prospect['Firstname'], prospect['Lastname'], prospect['Company']);

        const emailObject = { 
          firstName: prospect['Firstname'],
          lastName: prospect['Lastname'],
          company: prospect['Company'],
          email: email[0] 
        }

        await csvWriter.writeRecords([emailObject])

      } catch (error) {
        console.log(prospect)
        console.log(error)

        const emailObject = { 
          firstName: prospect['Firstname'],
          lastName: prospect['Lastname'],
          company: prospect['Company']
        }

        await csvWriter.writeRecords([emailObject])
      }

    }

    
  }
}

run();