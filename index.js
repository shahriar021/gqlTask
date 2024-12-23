// Import necessary modules
import { createObjectCsvWriter } from "csv-writer";
import { request, gql } from "graphql-request";

// GraphQL endpoint and query
const endpoint = "https://countries.trevorblades.com/";

const query = gql`
  query {
    countries {
      name
      capital
      currency
    }
  }
`;

// Function to fetch countries
async function fetchCountries() {
  try {
    const data = await request(endpoint, query);
    console.log("Fetched Countries:", data.countries);
    return data.countries;
  } catch (error) {
    console.error("Error fetching countries:", error);
    throw error; // Re-throw error for further handling
  }
}

// Function to post country data to REST API
async function postCountry(country) {
  const postData = {
    title: `Country: ${country.name}`,
    body: `Capital: ${country.capital}, Currency: ${country.currency}`,
    userId: 1,
  };

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
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
}

// Function to retry a request with exponential backoff
async function retryRequest(postData, retries = 5, delay = 1000) {
  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/posts", {
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
      await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retrying
      await retryRequest(postData, retries - 1, delay * 2); // Exponential backoff
    } else {
      console.error("Max retries reached. Failed to post data.");
    }
  }
}

const csvWriter = createObjectCsvWriter({
  path: "countries.csv",
  header: [
    { id: "name", title: "Country Name" },
    { id: "capital", title: "Capital" },
    { id: "currency", title: "Currency" },
  ],
});

async function saveToCSV(countries) {
  try {
    await csvWriter.writeRecords(countries);
    console.log("CSV file saved successfully.");
  } catch (error) {
    console.error("Error saving to CSV:", error);
  }
}

// Main function to fetch and post country
async function main() {
  try {
    const countries = await fetchCountries();
    if (countries && countries.length > 0) {
      await saveToCSV(countries);
      for (let country of countries) {
        await postCountry(country); // Post each country
      }
    } else {
      console.log("No countries to post.");
    }
  } catch (error) {
    console.error("An error occurred during the process:", error);
  }
}

main();

// Start the process
main();
