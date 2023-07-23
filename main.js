const express = require('express')
const app = express()
const port = 3000


var http = require ('http');
var fs = require ('fs');
var discord = require ('discord.js');
var icy = require ('icy');

// Create a webhook using the discord.js module
var webhook = new discord.WebhookClient ({id: process.env.hookid, token: process.env.hooktoken});

// Create a function that downloads audio from a url
function downloadAudio (url, fileName, callback) {
  var file = fs.createWriteStream (fileName);
  var request = http.get (url, function (response) {
    response.pipe (file);
    file.on ('finish', function () {
      file.close (callback); // close () is async, call callback after close completes.
    });
  }).on ('error', function (err) { // Handle errors
    fs.unlink (fileName); // Delete the file async. (But we don't check the result)
    if (callback) callback (err.message);
  });
};

// Create a function that returns the url for downloading the wav file from the kiwisdr
function getTuneUrl (frequency, duration) {
  var url = 'http://73.45.156.230:8073/?f=' + frequency + 'am';
  return new Promise ((resolve, reject) => {
    icy.get (url, function (res) {
      // Click the play button to start the stream
      res.on ('data', function (data) {
        if (data.toString ().includes ('id-play-button')) {
          res.write ('click');
        }
      });
      // Click the record button to start recording
      res.on ('end', function () {
        res.write ('click id-rec1 id-btn-grp-5 w3-pointer fa fa-repeat fa-stack-1x w3-text-pink');
      });
      // Wait for the duration and then click the record button again to stop recording
      setTimeout (() => {
        res.write ('click id-rec1 id-btn-grp-5 w3-pointer fa fa-repeat fa-stack-1x w3-text-pink');
        // Resolve the url of the downloaded wav file
        resolve (url + '/kiwi.dl/kiwi_8th_Dipolee.wav');
      }, duration * 1000);
    }).on ('error', function (err) { // Handle errors
      reject (err.message);
    });
  });
};

// Create a function that records and sends the audio to the discord channel
async function recordAndSendAudio (frequency, duration) {
  try {
    // Get the url for downloading the wav file
    var downloadUrl = await getTuneUrl (frequency, duration);
    // Download the audio from the url
    var fileName = frequency + '.wav';
    downloadAudio (downloadUrl, fileName, function (err) {
      if (err) {
        console.error (err);
      } else {
        console.log ('Downloaded ' + fileName);
        // Send the audio file to the discord channel using the webhook
        webhook.send ('Here is the recording of ' + frequency + ' AM', {
          files: [fileName]
        }).then (() => {
          console.log ('Sent ' + fileName);
          // Delete the audio file
          fs.unlinkSync (fileName);
        }).catch ((err) => {
          console.error (err);
        });
      }
    });
  } catch (err) {
    console.error (err);
  }
};

// Start the script and print a message
console.log ('The script has started');
// Set an interval to record and send audio every 1 minute
setInterval (() => {
  recordAndSendAudio (1000, 15); // Change the frequency and duration as needed
}, 60 * 1000); // Change the interval as needed




app.get('/', (req, res) => {
res.send('Hello World!')
})

app.listen(port, () => {
 console.log(`Example app listening at http://localhost:${port}`)
})
