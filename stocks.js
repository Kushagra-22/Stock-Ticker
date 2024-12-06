import express from "express";
import axios from "axios";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import URL from "./models/url.js";
import urlRoute from "./routes/url.js";
import staticRoute from "./routes/staticRoutes.js";
import userRoute from "./routes/user.js";

const app = express();
app.set("view engine", "ejs");


app.use(express.urlencoded({ extended: true }));

app.use(express.json()); // for parsing application/json
// app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use("/url", urlRoute);
app.use("/user", userRoute);
app.use("/", staticRoute);

const PORT = process.env.PORT || 3000;
// const stockApi = "demo";
const stockApi = "XGTJKGJWQGQT0FV0";
let stockName = "";
app.use(bodyParser.urlencoded({ extended: true }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.get("/url/:shortId", async (req, res) => {
  const shortId = req.params.shortId;
  const entry = await URL.findOneAndUpdate(
    {
      shortId,
    },
    {
      $push: {
        visitHistory: {
          timestamp: Date.now(),
        },
      },
    }
  );
  res.redirect(entry.redirectURL);
});
// Authentication
const requireAuthentication = (req, res, next) => {
  const authToken = req.headers.authorization;
  res.send();
  if (authToken === "valid-token") {
    // Replace with real authentication logic
    next(); // Proceed to the next middleware/handler
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// HomePage
app.get("/", async (req, res) => {
  // console.log(stockData.data.bestMatches[0]["1. symbol"]);

  res.render("stocks.ejs", {
    content: "",
  });

  //   stockData=JSON.stringify(stockData.data)
});

app.post("/stockInfo", requireAuthentication, async (req, res) => {
  headers: {
    authorization: "valid-token";
  }
  stockName = req.body.stock;
  let stocks = ["BA", "tesco", "tencent", "SAIC"];
  if (stockApi == "demo") {
    const randomIndex = Math.floor(Math.random() * stocks.length);
    stockName = stocks[randomIndex];
  }
  let stockData = await axios.get(
    `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${stockName}&apikey=${stockApi}`
  );
  stockData = stockData.data.bestMatches;

  res.render("stocks.ejs", {
    // content: stockData.data.bestMatches[0]["1. symbol"],
    content: stockData,
  });
});

app.post("/submit", async (req, res) => {
  let stockName = req.body.symbol;
  console.log(stockName);
  const stocks = ["IBM", "TSCO.LON"];
  if (stockApi == "demo") {
    const randomIndex = Math.floor(Math.random() * stocks.length);
    stockName = stocks[randomIndex];
  }

  const stockData = await axios.get(
    `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${stockName}&apikey=${stockApi}`
  );
  const timeSeries = stockData.data["Monthly Time Series"];

  const sortedKeys = Object.keys(timeSeries).sort(
    (a, b) => new Date(b) - new Date(a)
  );

  const filteredKeys = sortedKeys.filter(
    (date) => new Date(date) >= new Date("2024-01-01")
  );

  let filteredData = stockData.data["Meta Data"];
  filteredKeys.forEach((key) => {
    filteredData[key] = timeSeries[key];
  });
  const priceData = {};
  filteredKeys.forEach((key) => {
    priceData[key] = timeSeries[key];
  });
  // console.log(priceData);
  res.render("stock2.ejs", { content: filteredData["2. Symbol"], priceData });
});

app.get("/form", (req, res) => {
  res.render("stock3.ejs");
});

// connectToMongoDB("mongodb://localhost:27017/short-url").then(() =>
//   console.log("Mongodb connected")
// );

app.listen(PORT, () => {
  console.log(`http://localhost:3000/`);
});
