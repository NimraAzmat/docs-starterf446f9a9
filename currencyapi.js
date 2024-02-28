import fs from 'fs';
import axios from 'axios';
import readline from 'readline';
import OrbitDB from 'orbit-db';
import { create } from 'ipfs-http-client';
import path from 'path';
import express from 'express';


const app = express();
const ipfs = create({
    host: '127.0.0.1',
    port: '5001',
    protocol: 'http'
});

// Function to access OrbitDB and retrieve data
async function accessOrbitDB() {
    try {
        const dbConfigPath = './currency-database.json';
        const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath));

        const databaseAddress = dbConfig.address;
        const orbitdb = await OrbitDB.createInstance(ipfs);
        const db = await orbitdb.kvstore(databaseAddress);

        await db.load();

        const data = db.all;
        await db.close();
        await orbitdb.stop();
        return data;
    } catch (error) {
        console.error('Error writing to OrbitDB:', error.message);
        console.error(error.stack);
        throw new Error('Error accessing OrbitDB:', error);
    }
}
async function accessCryptoOrbitDB() {
    try {
        const dbConfigPath = './crypto-database.json';
        const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath));

        const databaseAddress = dbConfig.address;
        const orbitdb = await OrbitDB.createInstance(ipfs);
        const db = await orbitdb.kvstore(databaseAddress);

        await db.load();

        const data = db.all;
        await db.close();
        await orbitdb.stop();
        return data;
    } catch (error) {
        console.error('Error writing to OrbitDB:', error.message);
        console.error(error.stack);
        throw new Error('Error accessing OrbitDB:', error);
    }
}
async function accessForexOrbitDB() {
    try {
        const dbConfigPath = './forex-database.json';
        const dbConfig = JSON.parse(fs.readFileSync(dbConfigPath));

        const databaseAddress = dbConfig.address;
        const orbitdb = await OrbitDB.createInstance(ipfs);
        const db = await orbitdb.kvstore(databaseAddress);

        await db.load();

        const data = db.all;
        await db.close();
        await orbitdb.stop();
        return data;
    } catch (error) {
        console.error('Error writing to OrbitDB:', error.message);
        console.error(error.stack);
        throw new Error('Error accessing OrbitDB:', error);
    }
}

async function getForexData() {
    try {
        // Second API request
        const forexAppId = '24e4b28d4ab147b5af6c7654bdde19de';
        const forexApiUrl = 'https://openexchangerates.org/api/latest.json';
        const forexParams = { app_id: forexAppId };

        const response2 = await axios.get(forexApiUrl, { params: forexParams });
        const forexRates = response2.data.rates;
        const timeforex = Math.floor(response2.data.timestamp);
        // console.log("Timestamp forex:", timeforex);
        // Store the response separately
        const forexResponse = { ...forexRates, timeforex };
        // console.log("response of forex:", forexResponse);

        return forexResponse;
    } catch (error) {
        console.error('Error making API request:', error.message);
    }
}

// Function to fetch crypto data from an API
async function fetchCryptoData() {
    const cryptoApiUrl = 'https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest';
    const cryptoApiKey = '65b94a70-d1cc-458b-865b-7f6e023e904a';
    const cryptoParams = {
        convert: 'USD',
        id: '1,1027,825,328',
    };
    const cryptoHeaders = {
        'Accept': 'application/json',
        'X-CMC_PRO_API_KEY': cryptoApiKey,
    };

    try {
        const response = await axios.get(cryptoApiUrl, { params: cryptoParams, headers: cryptoHeaders });
        const cryptocurrencies = response.data.data;
        const timestamp = response.data.status.timestamp;
        const cryptoTimestamp = Math.floor(new Date(timestamp).getTime() / 1000);
        const cryptoDataObject = {};

        // console.log("Unix timestamp of crypto", cryptoTimestamp);

        Object.keys(cryptocurrencies).forEach((cryptoId) => {
            const { symbol, quote } = cryptocurrencies[cryptoId];
            const { price } = quote.USD;
            if (!cryptoDataObject[symbol]) {
                cryptoDataObject[symbol] = {};
            }
            cryptoDataObject[symbol] = price;
        });

        return { cryptoDataObject, cryptoTimestamp };
    } catch (error) {
        throw new Error('Error fetching crypto data:', error.message);
    }
}
async function addcryptoDataDB(data) {
    // console.log('Add Data to db is called');
    try {
        // Read the OrbitDB address from the JSON file
        const dbFilePath = path.join('./crypto-database.json');
        const dbDetails = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
        const databaseAddress = dbDetails.address;



        // Create an instance of OrbitDB
        const orbitdb = await OrbitDB.createInstance(ipfs);

        // Access the OrbitDB database using its address
        const db = await orbitdb.kvstore(databaseAddress);

        // Load the database
        await db.load();
        console.log('Database loaded');

        await db.del('data')
        // Insert the new data into the database
        await db.put('crypto', data);
        // console.log('Data added to OrbitDB:', data);

        await db.close();
        await orbitdb.stop();
    } catch (error) {
        console.error('Error accessing OrbitDB:', error);
    }
}
async function addforexDataDB(data) {
    try {
        // Read the OrbitDB address from the JSON file
        const dbFilePath = path.join('./forex-database.json');
        const dbDetails = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
        const databaseAddress = dbDetails.address;

        // Create IPFS instance
        const ipfs = create({
            host: '127.0.0.1',
            port: '5001',
            protocol: 'http'
        });

        // Create an instance of OrbitDB
        const orbitdb = await OrbitDB.createInstance(ipfs);

        // Access the OrbitDB database using its address
        const db = await orbitdb.kvstore(databaseAddress);

        // Load the database
        await db.load();
        console.log('Database loaded');

        // Add data to OrbitDB
        // await db.put("forex", data);

        // Retrieve and print the updated data
        const updatedData = db.all;
        // console.log('Updated Data in OrbitDB:', updatedData);

        await db.close();
        await orbitdb.stop();
    } catch (error) {
        console.error('Error writing to OrbitDB:', error.message);
        console.error(error.stack);
        // console.error('Error accessing or updating OrbitDB:', error);
    }
}
async function addCurrencyDataDB(data) {
    // console.log('Add Data to db is called');
    try {
        // Read the OrbitDB address from the JSON file
        const dbFilePath = path.join('./currency-database.json');
        const dbDetails = JSON.parse(fs.readFileSync(dbFilePath, 'utf-8'));
        const databaseAddress = dbDetails.address;

        // Create an instance of OrbitDB
        const orbitdb = await OrbitDB.createInstance(ipfs);

        // Access the OrbitDB database using its address
        const db = await orbitdb.kvstore(databaseAddress);

        // Load the database
        await db.load();
        console.log('Database loaded');

        // Insert the new data into the database
        await db.put('currency', data);
        // console.log('Data added to OrbitDB:', data);

        await db.close();
        await orbitdb.stop();
    } catch (error) {
        console.error('Error accessing OrbitDB:', error);
    }
}
app.get('/extract/currency/:timestamp', async (req, res) => {
    try {
        const userTime = parseInt(req.params.timestamp);
        console.log(`User entered timestamp: ${userTime}`);

        const dbCryptoData = await accessCryptoOrbitDB();
        //crypto and forex timestamps
        const cryptoTimestamp = dbCryptoData.crypto.cryptoTimestamp;
        console.log(`Database Crypto timestamp: ${cryptoTimestamp}`);
        const cryptotimeDifference = userTime - cryptoTimestamp;
        const dbForexData = await accessForexOrbitDB();
        const forexTimestamp = dbForexData.forex.timeforex;
        console.log(`Database Forex timestamp: ${forexTimestamp}`);
        const forextimeDifference = userTime - forexTimestamp;
        console.log('Time differences:', cryptotimeDifference, forextimeDifference)
        
        if (cryptotimeDifference >= 300) {
            console.log('Data needs to be updated. Fetching crypto data...');
            const { cryptoDataObject, cryptoTimestamp } = await fetchCryptoData();
            const newData = {
                BTC: cryptoDataObject.BTC,
                ETH: cryptoDataObject.ETH,
                XMR: cryptoDataObject.XMR,
                USDT: cryptoDataObject.USDT,
                cryptoTimestamp: cryptoTimestamp
            };

            await addcryptoDataDB(newData);
            console.log('Database updated with new crypto data.');
        } else {
            console.log('Crypto data is up to date. No need to update.');
        }

        if (forextimeDifference >= 86400) {
            console.log('Data needs to be updated. Fetching forex data...');
            const newForexData = await getForexData();
            // console.log("New forex data is to be added:", newForexData);
            await addforexDataDB(newForexData);
            console.log('Database updated with new Forex data.');
        } else {
            console.log('Forex data is up to date. No need to update.');
        }

        const updatedCryptoData = await accessCryptoOrbitDB();
        const updatedForexData = await accessForexOrbitDB();

        const combinedData = {
            crypto: updatedCryptoData.crypto,
            forex: updatedForexData.forex
        };

        await addCurrencyDataDB(combinedData);
        // console.log('new data ',combinedData)
        const currencyData = await accessOrbitDB();
        console.log("Data sended");
        
        return res.json(currencyData);
        
    } catch (error) {
        console.error(error.message);    
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});