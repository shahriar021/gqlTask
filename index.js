import { createObjectCsvWriter } from "csv-writer";
import { request, gql } from "graphql-request";
import { graphqlApi, jsonApi } from "./baseApi.js";

const query = gql`
  query {
    countries {
      name
      capital
      currency
    }
  }
`;

//My 2 api's are in baseApi.js file

// In this function i am fetching all countries.
const fetchCountries = async () => {
  try {
    const data = await request(graphqlApi, query);
    console.log("Fetched Countries:", data.countries);
    return data.countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error; // Re-throw error for further handling
  }
};

// Here i am posting each country.
const postCountry = async (country) => {
  const postData = {
    title: `Country: ${country.name}`,
    body: `Capital: ${country.capital}, Currency: ${country.currency}`,
    userId: 1,
  };

  try {
    const response = await fetch(jsonApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.error("403 Forbidden: Skipping this request.");
        return; // Skip the request for 403
      } else if (response.status === 500) {
        console.error("500 Internal Server Error: Retrying request...");
        await retryRequest(postData); // Retry on 500 error
        return;
      }
      throw new Error(`Failed to post data. Status: ${response.status}`);
    }

    const result = await response.json();
    console.log("Successfully posted:", result);
  } catch (error) {
    console.error("Error posting country:", error);
  }
};

// this fucntion is for retry.here it waits before resolve.
const retryRequest = async (postData, retries = 5, delay = 1000) => {
  try {
    const response = await fetch(jsonApi, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (response.ok) {
      const result = await response.json();
      console.log("Successfully posted after retry:", result);
    } else {
      throw new Error(`Failed to post after retry. Status: ${response.status}`);
    }
  } catch (error) {
    if (retries > 0) {
      console.error(`Retrying... ${retries} attempts left.`);
      await new Promise((resolve) => setTimeout(resolve, delay)); 
      await retryRequest(postData, retries - 1, delay * 2); 
    } else {
      console.error("Max retries reached. Failed to post data.");
    }
  }
};

//here i have used the package npm i csv-writer
//first it creats the csv and records all data of country.
const csvWriter = createObjectCsvWriter({
  path: "countries.csv",
  header: [
    { id: "name", title: "Country Name" },
    { id: "capital", title: "Capital" },
    { id: "currency", title: "Currency" },
  ],
});

const saveToCSV = async (countries) => {
  try {
    await csvWriter.writeRecords(countries);
    console.log("CSV file saved successfully.");
  } catch (error) {
    console.error("Error saving to CSV:", error);
  }
};

// This is the main function.All starts from here.Let me tell you the flow.
//First of all it calls the fetchCountries() and the it shows all the data.
//Then it calls saveToCSV() based on a condition if there are any data of countries
//Then starts the postCountry with a loop which is totally an automation ,no need to manually post any country
//no need to check any error,if its 403 then it skip and if it s 500 it calls the retryRequest()
//finaly the postCountry() will show the success or failure message.
async function main() {
  try {
    const countries = await fetchCountries();
    if (countries && countries.length > 0) {
      await saveToCSV(countries);
      for (let country of countries) {
        await postCountry(country);
      }
    } else {
      console.log("No countries to post.");
    }
  } catch (error) {
    console.error("An error occurred during the process:", error);
  }
}

main();
