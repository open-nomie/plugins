let date = new Date().toDateString();

/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Weather",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  addToWidgets: true,
  emoji: "⛈",
  version: "1.0",
  description: `Track the weather with OpenWeatherMap. Using your location, this plugin will track the weather one time a day, as long as you open Nomie. **Note** this does require an API key from OpenWeatherMaps.`,
  uses: ["createNote", "onLaunch", "getLocation"],
});

/**
 * It takes a location object, makes a call to the OpenWeatherMap API, and returns a weather object
 * @param location - {lat: number, lng: number}
 * @returns An object with the following properties:
 *   temp, name, tempHigh, tempLow, feelsLike, clouds, pressure, wind, latitude, longitude,
 * description, latitude, longitude, dateString
 */
const getCurrentConditions = async (location, apikey) => {
  // Determine user Units
  const units = !plugin.prefs?.useMetric ? "imperial" : "metric";
  // Call Open Weather Map
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${location.lat}&lon=${location.lng}&appid=${apikey}&units=${units}`;
  const call = await fetch(url);
  const data = await call.json();

  // Prep the data
  let weatherData = {};
  if (data) {
    weatherData.temp = data.main.temp;
    weatherData.name = data.name;
    weatherData.tempHigh = data.main.temp_max;
    weatherData.tempLow = data.main.temp_min;
    weatherData.feelsLike = data.main.feels_like;
    weatherData.clouds = data.clouds?.all;
    weatherData.pressure = data.main.pressure;
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
    view: "modal",
    apikey: undefined,
    registered: false
  }),
  async mounted() {
   
    /**
     * On Launch
     * Gets fired each time the user opens Nomie
     */
    plugin.onLaunch(() => {
      this.view = 'hidden';
      this.loadWeather();
    });

    /**
     * On Widget
     * Gets fired each time the widget is displayed
     */
    plugin.onWidget(() => {
      this.view = "widget";
      this.loadWeather();
    });

    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(() => {
      this.view = "modal";
      this.loadWeather();
    });

    /**
     * When the Plugin is Registered
     * Check if we have an API key for OpenWeatherMap
     * if not, prompt the user for the api
     */
    plugin.onRegistered(async (payload) => {
      // Initialize the Storage 
      await plugin.storage.init();
      // Get Key from storage
      this.apikey = plugin.storage.getItem("apikey");
      // Set LocationId and Plugin Id
      this.lid = payload.lid;
      this.pid = payload.pid;
      // Tag we're registered
      this.registered = true;
      // If no API key, ask the user for one. 
      if (!this.apikey) {
        const res = await plugin.prompt(
          "OpenWeatherMap API Key",
          `OpenWeatherMap API Required. Get your [FREE API key here](https://home.openweathermap.org/api_keys)`
        );
        if (res && res.value) {
          this.apikey = res.value;
          plugin.storage.setItem("apikey", this.apikey);
        }
      }
    });

    /**
     * Wait for 6 seconds then throw an error if we didnt get the temp.
     */
    setTimeout(() => {
      if (!this.currently.temp)
        this.error = "Unable to get your weather. Try again later.";
    }, 6000);
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
     
      try {
        let fromCache = plugin.storage.getItem("last-weather-lookup");
        // let lookupData = fromCache || {};
        let lookupData = {};
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
            let weather = await getCurrentConditions(location, this.apikey);
            if (weather) {
              // Tag the date
              weather.captured = date;
              // If we have a temp - we're good to go
              if (weather.temp) {
                // Save to Plugin storage in Nomie
                await plugin.storage.setItem("last-weather-lookup", weather);
              }
            }
            cached = weather;
            cached.fresh = true;
          }
        } 
        return cached;
      } catch (e) {
        this.error = `${e}`;
      }
    },
    async getWeatherAsNote() {
      const currently = await this.getWeatherCached();
      if (currently) {
        return {
          note: `#temp(${currently.temp}) #temp_high(${currently.tempHigh}) #temp_low(${currently.tempLow}) #clouds(${currently.clouds}) #wind(${currently.wind}) #pressure(${currently.pressure})`,
          lat: currently.latitude,
          lng: currently.longitude,
          location: currently.name
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
