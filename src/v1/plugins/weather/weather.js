let date = new Date().toDateString();

/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Weather",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  addToWidgets: true,
  emoji: "⛈",
  version: "1.2",
  description: `Track the weather with Tomorrow.io. Using your location, this plugin will track the weather one time a day, as long as you open Nomie. **Note** this plugin requires a FREE API key from Tomorrow.io`,
  uses: ["createNote", "onLaunch", "getLocation"],
});

const debug = false;
const logger = (a, b, c, d) => {
  if (debug) {
    console.log("%c" + "Weather Plugin", "font-weight:bold;");
    console.log("🌨", a, b ? b : '', c ? c : '', d ? d : '');
  }
}


const msToHourFormat = (ms) => {
  // 1- Convert to seconds:
  let seconds = ms / 1000;
  // 2- Extract hours:
  const hours = parseInt(seconds / 3600); // 3,600 seconds in 1 hour
  seconds = seconds % 3600; // seconds remaining after extracting hours
  // 3- Extract minutes:
  const minutes = parseInt(seconds / 60); // 60 seconds in 1 minute
  // 4- Keep only seconds not extracted to minutes:
  seconds = seconds % 60;
  return (hours + ":" + minutes + ":" + seconds);
}


/**
 * It takes a location object, makes a call to the OpenWeatherMap API, and returns a weather object
 * @param location - {lat: number, lng: number}
 * @returns An object with the following properties:
 *   temp, name, tempHigh, tempLow, feelsLike, clouds, pressure, wind, latitude, longitude,
 * description, latitude, longitude, dateString
 */
const getCurrentConditions = async (location, apikey) => {
  logger("getCurrentConditions", { location, apikey });
  // Determine user Units
  const units = !plugin.prefs?.useMetric ? "imperial" : "metric";
  // Call Open Weather Map

  const timeSteps = '1d'

  const fields = [
    "sunriseTime",
    "sunsetTime",
    "windSpeed",
    "pressureSurfaceLevel",
    "temperatureMin",
    "temperatureMax",
    "cloudCover",
    "precipitationType",
    "humidity"
  ].map((field) => {
    return `fields=${field}`;
  }).join('&');
  //&startTime=${start}&endTime=${end}


  const params = [
    `location=${location.lat},${location.lng}`,
    fields,
    // `startTime=${start}`,
    // `endTime=${end}`,
    `units=${units}`,
    `timesteps=1d`
  ]


  const urlParams = params.join('&') + `&apikey=${apikey}`;

  logger("Calling Tomorrow API")
  const url = `https://api.tomorrow.io/v4/timelines?${urlParams}`;
  const call = await fetch(url);
  const data = await call.json();
  logger("Tomorrow results", data);


  if (data && data.data) {
    let weather = data.data.timelines[0];
    let day = weather.intervals[0].values;
    let dayTimeLight = new Date(day.sunsetTime).getTime() - new Date(day.sunriseTime).getTime();

    let weatherData = {
      'temp': day.temperatureMax,
      'temp_low': day.temperatureMin,
      'day_length': msToHourFormat(dayTimeLight),
      'pressure': day.pressureSurfaceLevel,
      'wind_speed': day.windSpeed,
      'clouds': day.cloudCover,
      'humidity': day.humidity,
      'precipitation': day.precipitationType,
    };

    let description = "";
    if (day.precipitationType == 0) {
      weatherData.weather_sunny = null
      description = "Sunny"
    } else if (day.precipitationType == 1) {
      weatherData.weather_rain = null;
      description = "Rain"
    } else if (day.precipitationType == 2) {
      weatherData.weather_snow = null;
      description = "Snow"
    } else if (day.precipitationType == 3) {
      weatherData.weather_freezing = null;
      description = "Freezing Rain"
    } else if (day.precipitationType == 4) {
      weatherData.weather_ice = null;
      description = "Icy conditions"
    }

    const note = Object.keys(weatherData).map((tag) => {
      let value = weatherData[tag];
      if (!value) {
        return `#${tag}`;
      }
      return `#${tag}(${value})`;
    }).join(' ');

    // note = note + ` ` + addOnData.map((str)=>str).join(' ');
    weatherData.note = note;
    weatherData.latitude = location.lat;
    weatherData.longitude = location.lng;
    weatherData.description = description;
    weatherData.dateString = plugin.dayjs().format('ddd Do MMM YYYY');

    return weatherData;

  } else {
    return undefined;
  }



};

const API_KEY_NAME = "tomorrow-api-key";

/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,
    currently: {},
    view: "modal",
    apikey: undefined,
    registered: false,
    ignoreFields: [],
    autoTrack: false,
    errors: [],
    location: undefined
  }),
  async mounted() {
    /**
     * On Launch
     * Gets fired each time the user opens Nomie
     */
    plugin.onLaunch(() => {
      logger("plugin.onLaunch", this.apikey);
      setTimeout(() => {
        this.view = 'hidden';
        if (this.apikey) this.loadWeather();
      }, 500);
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
    plugin.onUIOpened(async () => {
      this.view = "modal";
      this.autoTrack = plugin.storage.getItem('autoTrack') ? true : false;

      if (!this.apikey) {
        logger("onUIOpened - no API Key Found")
        await this.getAndSetApiKey()
      } else {
        logger("onUIOpened - API Key exists")
        this.loadWeather();
      }

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
      this.ignoreFields = plugin.storage.getItem('ignoreFields') || [];
      this.autoTrack = plugin.storage.getItem('autoTrack') === false ? false : true;
      this.apikey = plugin.storage.getItem(API_KEY_NAME);
      logger("onRegistered - this.apikey", this.apikey.length, this.autoTrack);
      // Set LocationId and Plugin Id
      this.lid = payload.lid;
      this.pid = payload.pid;
      // Tag we're registered
      this.registered = true;

    });




    /**
     * Wait for 6 seconds then throw an error if we didnt get the temp.
     */
    setTimeout(() => {
      if (!this.currently.temp)
        this.showError("Unable to get your weather.");
      if (!this.location) this.showError("Could not find location")
      if (!this.registered) this.showError("Plugin was not properly registered, try to exit and refresh plugin or Nomie.")
    }, 6000);
  },
  watch: {
    "autoTrack"() {
      plugin.storage.setItem('autoTrack', this.autoTrack);
    }
  },
  methods: {
    clearErrors() {
      this.errors = [];
    },
    showError(message) {
      this.errors.push(message);
    },
    /**
     * > Prompt the user for their API key, if they provide one, save it and load the weather
     * @returns A boolean value.
     */
    async getAndSetApiKey() {
      logger("Get the Tomrorrow API Key");
      const res = await plugin.prompt(
        "Tomorrow.io API Key",
        `Tomorrow.io Account & API are required. Get your [FREE API key here](https://app.tomorrow.io/development/keys)`
      );
      if (res && res.value && res.value.length > 4) {
        this.apikey = res.value;
        plugin.storage.setItem(API_KEY_NAME, this.apikey);
        logger("getAndSetAPIKey res", this.apikey.length);
        this.loadWeather();
        return true;
      } else {
        alert("Invalid Weather Key provided");
      }
    },

    async getLocation() {
      const location = await plugin.getLocation();
      this.location = location;
      return location;
    },

    /**
     * It gets the user's location, then gets the weather for that location, then if the weather is
     * fresh and the user has auto-tracking enabled, it tracks the weather, then if there was an error,
     * it sets the error message, otherwise it sets the current weather
     */
    async loadWeather() {
      logger("loadWeather()");
      const location = await this.getLocation();
      logger("loadWeather Location", location);
      if (location) {
        try {
          let weather = await this.getWeatherCached(location);
          if (weather.fresh && this.autoTrack) {
            this.trackWeather();
          }
          if (weather) this.clearErrors();
          this.currently = weather;
        } catch (e) {
          this.showError(`${e}`);
        }
      } else {
        this.showError("Unable to find your location");
      }
    },
    /**
     * > If we have a cached weather object, and it was captured today, return it. Otherwise, get the
     * current location, and if we have a lat/long, get the current weather conditions, and return them
     * @returns The weather data
     */
    async getWeatherCached() {
      const LAST_WEATHER_KEY = 'cached-weather';
      logger("getWeatherCached()");
      try {
        let fromCache = plugin.storage.getItem(LAST_WEATHER_KEY);
        let lookupData = fromCache || {};
        // let lookupData = {};
        let cached = undefined;
        // Have lookup data?
        if (lookupData && lookupData.captured) {
          // Is the last day today?
          if (lookupData.captured === new Date().toDateString()) {
            cached = lookupData;
            cached.fresh = false;
            logger("getWeatherCache Exists for today - no need to get fresh")
          }
        }

        // If it's not cached - lets get it
        if (!cached) {
          // Get User Location f
          const weather = await this.getFreshWeather();
          if (weather.temp) {
            // Save to Plugin storage in Nomie
            await plugin.storage.setItem(LAST_WEATHER_KEY, weather);
            cached = weather;
            cached.fresh = true;
          }
        }
        logger("getWeatherCached results", cached);
        return cached;
      } catch (e) {
        this.showError(`${e}`);
      }
    },
    async getFreshWeather() {

      logger("getFreshWeather()")
      let location = await this.getLocation();
      if (location) {
        logger("getFreshWeather() location", location);
        // Get weather based on location
        let weather = await getCurrentConditions(location, this.apikey);

        if (weather) {
          // Tag the date
          weather.captured = date;
          // If we have a temp - we're good to go
          return weather;
        } else {
          throw Error('Unable to get the weather right now... Try later')
        }
      }
    },
    async getWeatherAsNote(fresh) {
      let currently;
      if (fresh) {
        currently = await this.getFreshWeather();
      } else {
        currently = await this.getWeatherCached();
      }
      if (currently) {
        return {
          note: currently.note,
          lat: currently.latitude,
          lng: currently.longitude
        };
      }
      return undefined;
    },

    /**
     * It gets the weather as a note, and if it gets a note, it creates it
     */
    async trackWeather() {
      const weatherNote = await this.getWeatherAsNote(true);
      if (weatherNote) {
        plugin.createNote(weatherNote);
      }
    },
  },
}).$mount("#content");
