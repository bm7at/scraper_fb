const puppeteer = require('puppeteer');
const moment = require('moment');
//const express = require('express');
/*
const cors = require('cors')({
  origin: true,
});
*/

let browserPromise = puppeteer.launch({
  args: [
    '--no-sandbox',
  ]
});


// Vienna
const departureCity = 1394;
// Budapest
const arrivalCity = 1795;

const currentDate = moment();





exports.webscraperflix = async (req, res) => {

//Query Parameter via url - days, by default 8
  const dayLoop = req.query.url || '8';
  const browser = await browserPromise;
  const context = await browser.createIncognitoBrowserContext();
  const page = await context.newPage();
  await page.setViewport({width: 1920, height: 926});
  await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36');
  
              await page.setRequestInterception(true);
      
              page.on('request', (req) => {
                  if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() == 'image'){
                      req.abort();
                  }
                  else {
                      req.continue();
                  }
              });
  


try {

const result = [];
//start of loop over days
for (let i = 1; i < dayLoop; i++) {


let day = [];
let dayJson = {};

dayJson.day_Date = moment().add(i, 'days').format('ddd, DD.MM.YYYY')

day.push(dayJson);


currentDate.add(1, 'days');


let bookingUrl = `https://shop.flixbus.at/search?departureCity=${departureCity}&arrivalCity=${arrivalCity}&route=Vienna-Budapest&rideDate=${currentDate.format('DD.MM.YYYY')}&adult=1&_locale=at`;


  
  await page.goto(bookingUrl);
  

  // get ride details
  let rideData = await page.evaluate(() => {

    let rides = [];

    
 
   
    // get the ride elements
    let ridesElem = document.querySelectorAll('div.row.ride-available');
    // get the ride data
    ridesElem.forEach((ride) => {
      let rideJson = {};
      try {
        
        let timesElm = ride.querySelectorAll('table.flix-connection td');
        let counter = 0;
        timesElm.forEach((time) => {
          if (counter === 0) {
            rideJson.departure_time = time.querySelector('div.flix-connection__time.departure-time').innerText.trim();
          }
          if (counter === 1) {
            rideJson.departure_station = time.querySelector('div.flix-connection__station .station-name-label').innerText.trim();
          }
          if (counter === 2) {
            rideJson.arrival_time = time.querySelector('div.flix-connection__time').innerText.trim();
          }
          if (counter === 3) {
            rideJson.arrival_station = time.querySelector('div.flix-connection__station .station-name-label').innerText.trim();
          }
          counter++;
        });

        rideJson.duration = ride.querySelector('div.duration.ride__duration').innerText.replace("Schnellste Verbindung", ' ').trim().split(' ');
        rideJson.price = ride.querySelector('div.total span.num.currency-small-cents').innerText.trim().split(/\s/);

        
         
        
  
        
        
      } catch (exception) {

      }
      
      rides.push(rideJson);

      //push(rideJson);
      
      
    });

      

    
    
    return rides;
     
    
    
    

    
});

//Rides only at 9:50 and 9:30
/*
const rideMorning = rideData.filter(e => e.departure_time.includes("09:50"));
const rideMorning2 = rideData.filter(e => e.departure_time.includes("09:30"));

const resultarray = day.concat(rideMorning2, rideMorning);

result.push(resultarray);

*/

//Add day array to Data rides
const resultarray = day.concat(rideData);
//Add result of one loop to whole data
result.push(resultarray);

//console.log(rideData);
//const result = await resultarray.save();


};


res.set('Access-Control-Allow-Origin', '*');

      if (req.method === 'OPTIONS') {
        // Send response to OPTIONS requests
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        res.set('Access-Control-Max-Age', '3600');
        res.status(204).send(result);
      } else {
        res.send(result);
      }
    } catch (err) {
      res.status(500).send(err.message);
    } 
    
    context.close()
      
      
};
