let date = new Date().toDateString();
let lastDate = localStorage.getItem("last-date-v1");


/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Weather",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  emoji: "⛈",
  version: "1.0",
  description: "Get todays weather for your current location",
  uses: ["createNote", "onLaunch", "getLocation"],
});



/**
 * It takes a location object, makes a call to the OpenWeatherMap API, and returns a weather object
 * @param location - {lat: number, lng: number}
 * @returns An object with the following properties:
 *   temp, name, tempHigh, tempLow, feelsLike, clouds, pressure, wind, latitude, longitude,
 * description, latitude, longitude, dateString
 */
const getCurrentConditions = async (location) => {
  // Get API Key
  const apikey = plugin.storage.getItem('apikey');
  // Determine user Units
  const units = plugin.prefs?.useMetric ? 'metric' : 'imperial';
  // Call Open Weather Map
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apikey}&units=${units}`
  const call = await fetch(url);
  const data = await call.json();

  // Prep the data
  let weatherData = {};
  if (data) {
    weatherData.temp = data.main.temp
    weatherData.name = data.name;
    weatherData.tempHigh = data.main.temp_max
    weatherData.tempLow = data.main.temp_min
    weatherData.feelsLike = data.main.feels_lik
    weatherData.clouds = data.clouds?.all;
    weatherData.pressure = data.main.pressure
    weatherData.wind = data.wind?.speed;
    weatherData.latitude = location.lat;
    weatherData.longitude = location.lng;
  }

  return {
    ...weatherData,
    ...{
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      dateString: date,
    },
  };
};


/**
 * Vue 2.0 App 
 */
new Vue({
  data: () => ({
    error: undefined,
    currently: {},
  }),
  async mounted() {

    /**
     * On Launch
     * Gets fired each time the user opens Nomie 
     */
    plugin.onLaunch(() => {
      this.loadWeather();
    });

    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(() => {
      this.loadWeather();
    })

    /**
     * When the Plugin is Registered
     * Check if we have an API key for OpenWeatherMap
     * if not, prompt the user for the api
     */
    plugin.onRegistered(async () => {
      await plugin.storage.init();
      if (!plugin.storage.getItem('apikey')) {
        const key = await plugin.prompt('OpenWeatherMap API Key', 
          `OpenWeatherMap API Required. Get your [FREE API key here](https://home.openweathermap.org/api_keys)`)
        if (key && key.value) {
          plugin.storage.setItem('apikey', key.value);
        }
      }
    })

    /**
     * Wait for 6 seconds then throw an error if we didnt get the temp.
     */
    setTimeout(() => {
      console.log("error test", this.currently.temp);
      if (!this.currently.temp) this.error = "Unable to get your weather. Try again later.";
    }, 6000)

  },
  async unmounted() {
    console.log("unmounted weather");
  },
  methods: {
    async loadWeather() {
      const location = await plugin.getLocation();
      if (location) {
        let weather = await this.getWeatherCached(location);
        if (weather.fresh) {
          this.trackWeather();
        }
        this.currently = weather;
      } else {
        this.error = "Unable to fine your location";
      }

    },
    /**
     * > If we have a cached weather object, and it was captured today, return it. Otherwise, get the
     * current location, and if we have a lat/long, get the current weather conditions, and return them
     * @returns The weather data
     */
    async getWeatherCached() {
      let fromCache = await plugin.storage.getItem("last-weather-lookup")
      let lookupData = fromCache || {};
      let cached = undefined;

      // Have lookup data?
      if (lookupData && lookupData.captured) {
        // Is the last day today? 
        if (lookupData.captured === new Date().toDateString()) {
          cached = lookupData;
          cached.fresh = false;
        }
      }

      // If it's not cached - lets get it
      if (!cached) {
        // Get User Location f
        let location = await plugin.getLocation();
        if (location) {
          // Get weather based on location
          let weather = await getCurrentConditions(location);
          if (weather) {
            // Tag the date
            weather.captured = date;
            // If we have a temp - we're good to go
            if (weather.temp) {
              // Save to Plugin storage in Nomie 
              await plugin.storage.setItem('last-weather-lookup', weather);
            }
          }
          cached = weather;
          cached.fresh = true;
        }

      }
      return cached;
    },
    async getWeatherAsNote() {
      const currently = await this.getWeatherCached();
      if (currently) {
        return {
          note: `#temp(${currently.temp}) #tempHigh(${currently.tempHigh}) #tempLow(${currently.tempLow}) #clouds(${currently.clouds}) #wind(${currently.wind}) #pressure(${currently.pressure})`,
          lat: currently.latitude,
          lng: currently.longitude,
        };
      }
      return undefined;
    },
    async trackWeather() {
      const weatherNote = await this.getWeatherAsNote();
      if (weatherNote) {
        plugin.createNote(weatherNote);
      }
    },
  },
}).$mount("#content");