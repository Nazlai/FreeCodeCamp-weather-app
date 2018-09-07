"use strict";

const weatherKey = "e1b619194c09df431924b5e07cc22830";
const aqiKey = "46ea265521e4fef4126e2bd5dbc157b80c8ac099";

const fn = (function(){
    function setSunriseSunset(time){
       return time.toUTCString().split(" ")[4];
    }

    function temp(kelvin){
        return (kelvin - 273.15).toFixed(1);
    }
    function coord(coordinate){
        return coordinate.toFixed(2);
    }

    function cityInput(city){
        return city.substring(0,1).toUpperCase() + city.substring(1, city.length).toLowerCase();
    }
    return {
        sunriseSunset: setSunriseSunset,
        temp: temp,
        coord: coord,
        cityInput: cityInput
    }
})();

navigator.geolocation.getCurrentPosition(showPosition, showError, optn);

function showPosition(pos){
    const long = Math.floor(pos.coords.longitude);
    const lat = Math.floor(pos.coords.latitude);

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${long}&appid=${weatherKey}`;

    const aqiUrl = `https://api.waqi.info/feed/geo:${lat};${long}/?token=${aqiKey}`;
    
    fetch(weatherUrl)
      .then((res) => res.json())
      .then(function(value){
          console.log(value);
          document.querySelector("header h1").textContent = value.name;
          document.querySelector(".weatherDescription").querySelector("h2").textContent = value.weather[0].description;
          const timeNow = new Date(1000 * value.dt);
          const hourNow = timeNow.getHours();
          weather(hourNow, value.weather[0].main);

          const sunRise = new Date(1000 * value.sys.sunrise);
          const sunSet = new Date(1000* value.sys.sunset);
          const sunRiseTime = sunRise.toString().split(" ")[4];
          const sunSetTime = sunSet.toString().split(" ")[4];

          document.getElementById("sunrise").querySelector("p").textContent = sunRiseTime;
          document.getElementById("sunset").querySelector("p").textContent = sunSetTime;

          const temp = fn.temp(value.main.temp);
          document.getElementById("temp").querySelector("p").innerHTML = temp + "&#8451;";
          document.getElementById("humidity").querySelector("p").textContent = value.main.humidity + "%";
          document.getElementById("wind").querySelector("p").textContent = value.wind.speed + " km/h";
      })
      .catch(function(err){
          console.log(err);
      })
    
    
    fetch(aqiUrl)
      .then(function(res){return res.json()})
      .then(function(value){
          document.getElementById("aqi").querySelector("p").innerHTML = value.data.iaqi.pm25.v + "&#181;g/&#13221;";
          console.log(value);
      })
      .catch(function(err){
          console.log(err);
      })
}


function showError(err){
    console.log(err);
}

var optn = {
    enableHighAccuracy: true
}


// menu toggle 
const locationMenu = document.getElementById("location");

const menu =  document.getElementById("menu-toggle");
menu.addEventListener("click", function(){
    menu.classList.toggle("active");
    locationMenu.classList.toggle("active");
});

const inputSubmit = document.getElementById("location-submit");
inputSubmit.addEventListener("click", getWeather)

function getWeather(){
    
    const userInput = document.getElementById("location-input");
    const rawCityInput = userInput.value;
    const city = fn.cityInput(rawCityInput);
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherKey}`;
    
    fetch(weatherUrl)
      .then(function(res){ return res.json()})
      .then(function(value){
          console.log(value);
          document.querySelector("header h1").textContent = value.name;
          document.querySelector(".weatherDescription").querySelector("h2").textContent = value.weather[0].description;

          const temp = fn.temp(value.main.temp);
          document.getElementById("temp").querySelector("p").innerHTML = temp + "&#8451;";
          document.getElementById("humidity").querySelector("p").textContent = value.main.humidity + "%";
          document.getElementById("wind").querySelector("p").textContent = value.wind.speed + " km/h";
          // Then fetches aqi according to weather location query
          const lat = fn.coord(value.coord.lat);
          const lon = fn.coord(value.coord.lon);
          const aqiLat = Math.floor(fn.coord(value.coord.lat));
          const aqiLon = Math.floor(fn.coord(value.coord.lon));
          
          const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherKey}`;
          
          const aqiUrl = `https://api.waqi.info/feed/geo:${aqiLat};${aqiLon}/?token=${aqiKey}`;

          const timeKey = "7TP7WGKFF5OF"
          const timezoneUrl = `http://api.timezonedb.com/v2/get-time-zone?key=${timeKey}&format=json&by=position&lat=${lat}&lng=${lon}`
          
          const url = [weatherUrl,aqiUrl,timezoneUrl];
          return Promise.all(url.map(url => fetch(url)))
      })
      .then(res => Promise.all(res.map(res => res.json())))
      .then(function(queryValue){
          console.log(queryValue[0]);
          console.log(queryValue[1]);
          console.log(queryValue[2]);

          const weatherData = queryValue[0];
          const aqiData = queryValue[1];
          const timezoneData = queryValue[2];
          
          const timeNow = new Date(1000 * (weatherData.dt + timezoneData.gmtOffset));
          const hourNow = timeNow.getUTCHours(); // location's local time
          weather(hourNow, weatherData.weather[0].main); // sets background and icon according to weather description and location time

          const sunRise = new Date(1000 * (weatherData.sys.sunrise + timezoneData.gmtOffset));
          const sunSet = new Date(1000 * (weatherData.sys.sunset + timezoneData.gmtOffset));

          document.getElementById("sunrise").querySelector("p").textContent = fn.sunriseSunset(sunRise); // location's sunrise
          document.getElementById("sunset").querySelector("p").textContent = fn.sunriseSunset(sunSet); // location's sunset

          document.getElementById("aqi").querySelector("p").innerHTML = aqiData.data.iaqi.pm25.v + "&#181;g/&#13221;"; // location's pm2.5 level
      })
      .catch(function(err){
          console.log(err);
      })

      // Toggle menu and hamburger
    menu.classList.toggle("active");
    locationMenu.classList.toggle("active");
    
}

function weather(time, weatherDescript){
    /* 
      Sets background of weatherIcon to day if input time is between 0600-1800
      Sets Icon depending on weather Desciprtion
    */  
    const weatherBg = document.querySelector(".weatherIcon_background");
    const weatherIcon = weatherBg.querySelector(".weatherIcon");
    if(time >= 6 && time <= 18){
        weatherBg.classList.add("day");
        weatherBg.classList.remove("night");
    } else {
        weatherBg.classList.add("night");
        weatherBg.classList.remove("day");
    }

    switch (weatherDescript){
        case "Clouds":
          weatherIcon.classList.remove("sun", "moon", "rain", "fog", "snow", "wind");
          weatherIcon.classList.add("cloud");
          break;
        case "Clear":
          if (time >= 6 && time <= 18){
              weatherIcon.classList.remove("cloud", "moon", "rain", "fog", "snow", "wind");
              weatherIcon.classList.add("sun");
          } else {
              weatherIcon.classList.remove("cloud", "sun","rain", "fog", "snow", "wind");
              weatherIcon.classList.add("moon");
          }
          break;
        case "Rain":
        case "Drizzle":
        case "Thunderstorm":
          weatherIcon.classList.remove("cloud", "sun", "moon","fog", "snow", "wind");       
          weatherIcon.classList.add("rain");
          break;
        case "Mist":
        case "Fog":
        case "Haze":
        case "Dust":
        case "Smoke":
          weatherIcon.classList.remove("cloud", "sun", "moon", "rain","snow", "wind");       
          weatherIcon.classList.add("fog");
          break;
        case "Snow":
          weatherIcon.classList.remove("cloud", "sun", "moon", "rain", "fog","wind");       
          weatherIcon.classList.add("snow");
          break;
        case "Wind":
          weatherIcon.classList.remove("cloud", "sun", "moon", "rain", "fog", "snow");        
          weatherIcon.classList.add("wind");
          break;
    }
}

