async function testAPI() {
    const url = `https://stok-5ytv.onrender.com/transactions?phone=67984726820&includeShared=true`;
    console.log(url);
    const response = await fetch(url);
    const data = await response.json();
    console.log("Keys:", Object.keys(data));
    console.log("Data:", data);
}
testAPI();
