require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser")
const cors = require('cors');
const mongo = require("mongo")
const mongoose = require("mongoose")
const AutoIncrement = require('mongoose-sequence')(mongoose);

const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

const { Schema } = mongoose
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// Create a schema for URL
const urlSchema = new Schema({ originalUrl: String })
urlSchema.plugin(AutoIncrement, {inc_field: 'shortUrl'})

// Define an URL model from schema
const urlModel = mongoose.model("urlModel", urlSchema)

// Set path and body parser for json using
app.use(cors());
app.use('/public', express.static(`${process.cwd()}/public`));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

// Home root
app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// My API root to set new short url
app.post("/api/shorturl", (req, res) => {
  let url;
  try {
    url = new URL(req.body.url)
    urlModel.findOne({originalUrl: url}, (err, data) => {
      if (err) res.json({ error: err.code })
      if (data) {
        res.json({
          original_url: data.originalUrl,
          short_url: data.shortUrl
        })
      } else {
        const newUrl = new urlModel({ originalUrl: url })
        newUrl.save((err, urlSaved) => {
          if (err) res.json({ error: err.code })
          res.json({
            original_url: urlSaved.originalUrl,
            short_url: urlSaved.shortUrl
          })
        })
      }
    })
  } catch (_) {
    res.json({ error: 'invalid url' })
  }
});

app.get("/api/shorturl/:shorturl", (req, res) => {
  const shorturl = req.params.shorturl
  urlModel.findOne({shortUrl: shorturl}, (err, data) => {
    if (err) res.json({ error: err.code })
    if (data) {
      res.redirect(data.originalUrl)
    } else {
      res.json({ error: 'invalid url' })
    }
  })
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
