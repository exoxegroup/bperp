import axios from 'axios';

const testBinance = async () => {
    console.log("Testing Binance Connectivity...");
    try {
        const response = await axios.get('https://fapi.binance.com/fapi/v1/exchangeInfo', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        console.log("Success! Status:", response.status);
        console.log("Symbols count:", response.data.symbols.length);
    } catch (error) {
        console.error("Error connecting to Binance:");
        if (axios.isAxiosError(error)) {
            console.error("Message:", error.message);
            console.error("Code:", error.code);
            if (error.response) {
                console.error("Response Status:", error.response.status);
                console.error("Response Data:", JSON.stringify(error.response.data).substring(0, 200));
            }
        } else {
            console.error(error);
        }
    }
};

testBinance();
