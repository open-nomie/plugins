# Nomie Plugins [WIP]

Nomie Plugins allows people who are familiar with HTML and Javascript to create entirely new methods of tracking and monitoring data within Nomie 6.

## Introduction

Nomie Plugins use iframes to load and communicate with “plugins”. So this really just means, a plugin is a hosted HTML page, that has some extra javascript to request data to and from Nomie. We do this by using postMessage and window.onMessage to securely pass data between Nomie and your Plugin. 

### Step 1. Include the nomie-plugin.js

This library is used to abstract the responsibility of posting messages and listening for messages, into simple async calls. This document outlines the specific functions of `nomie-plugin.js`. 

```jsx
<script src="https://plugins.nomie.app/v1/nomie-plugin.js">
```

## new NomiePlugin({pluginDetails})

Once you’ve included `nomie-plugin.js` you’ll have access to the `NomiePlugin` class within the documents window. 

```jsx
const plugin = new NomiePlugin({
  name: "Weather",
	emoji: "⛈",
  description: "Get todays weather for your current location",
  uses: ["createNote", "onLaunch", "getLocation"],
  version: "1.0",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  addToWidgets: false,
});
```

**Describe your plugin using the following properties:** 

- **name**: The name of your plugin
- **emoji**: The Emoji that best describes your plugin
- **description**: a description of your plugin - this field does support Markdown formatting.
- **uses:** 🚨 An array of specific features that are blocked by default, and require access to be granted by the User.
- **version**: The current version of the plugin. If you need to add **uses functions,** you need to bump your version
- **addToCaptureMenu**: `(true | false)` Include a menu item in the Capture Menu that opens the Plugin
- **addToMoreMenu**: `(true | false)` Include a menu item in Nomie’s More tab that opens the Plugin
- **addToWidgets**: `(true | false)` Add this plugin as a selectable Dashboard Widget

# Plugin Methods

Methods marked with `uses:[]` are blocked by default. You must specifically define these function names in the uses array - this helps ensure users are fully aware of the data this plugin can access. 

### plugin.createNote(string | log)

Create a new journal entry in Nomie.

`uses: [’createNote’]` is required for this method

```jsx
plugin.createNote("This is a Note");

// Or with options
plugin.createNote({
	note: "This is a Note",
	end: new Date('2010-10-11'),
	lat: 40.00,
	lng: -83.00,
	location: 'Pizza House',
	score: 3
});
```

### plugin.onLaunch(func)

Fires off each time the user launches Nomie 

`uses: [’onLaunch’]` is required for this method

```jsx
plugin.onLaunch(()=>{
  console.log("☔️☔️ weather plugin - onLaunch");
  this.loadWeather();
});
```

### plugin.onNote(func(log))

`uses: [’onNote’]` is required for this method

Fires off when the user save a new journal entry within Nomie - that is not SILENCED.  Silenced saves are ones that do not trigger a onNote call. This includes entries created from the API, entires created by plugins, or entries that have been edited. 

```tsx
plugin.onNote((note)=>{
	console.log("Note text", note.note)
	console.log("Note Date", note.end)
	console.log("Note Score", note.score)
	console.log("Note Tokens (raw trackable data)", note.tokens)
})
```

### plugin.getLocation(func)

`uses: [’getLocation’]` is required for this method

Get the users current location 

```jsx
const location = await plugin.getLocation();
if(location) {
	console.log(`User is located at ${location.lat},${location.lng}`)
}
```

### plugin.getTrackableUsage({tag, endDate, daysBack })

`uses: [’getTrackableUsage’]` is required for this method

Get trackable usage stats for a given  period of time.

- **tag**: string representing the trackable - for example `#mood, @mom, +vacation`
- **endDate**: the last Date of data you’d like - as a javascript date
- **daysBack**: the number of days you’d like data for - max is 90

```jsx
const call = await plugin.getTrackableUsage({ tag:'#alcohol', daysBack: 30 });
const usage = call.usage;
console.log("Trackable Values", usage.values); // array of values by day
console.log("Trackable Values", usage.dates); // array of dates 
```

### plugin.searchNotes(term, endDate, daysBack=7)

`uses: [’searchNotes’]` is required for this method

Search through all data notes stored in Nomie for a given term, and time frame. 

- **term**: undefined or a string
- **endDate**: last day of data to retrieve
- **daysBack**: number of Days to include in the search

```jsx
const notes = await plugin.searchNotes('#mood', new Date(), 30);
if(notes) {
	notes.forEach(entry=>{
		console.log(`This note: ${entry.note}`);
		console.log(entry);
	})
}
```

### plugin.selectTrackables(type, multiple:boolean)

`uses: [’selectTrackables’]` is required for this method

- **type**: undefined | tracker | context | person  - the type of trackables to show the user
- **multiple**: true | false  -  if the user can select multiple trackables or not
- **returns**: Promise<Array<trackables>>

```jsx
const mutipleTrackables = await plugin.selectTrackables(null, true);
const justOneTrackable = await plugin.selectTrackables(null);
const justAPersonTrackable = await plugin.selectTrackables('person');
```

### plugin.getTrackable(tag:string)

Convert a tag into the full trackable object, if the user has it configured.

```jsx
const trackable = await plugin.getTrackable('#mood');
console.log(`${trackable.emoji} ${trackable.tag} is a ${trackable.type} type`);
// If it's a tracker
console.log(trackable.tracker)
// if its a context
console.log(trackable.ctx)
// if its a person
console.log(trackable.person)
```

### plugin.getTrackableInput(tag:string)

Need a specific value for a trackable? Using getTrackableInput, the user will be prompted to provide an input for the specified trackable. If it’s a person or context, the value will be return immediately, if its a tracker, then the tracker specific input will be displayed. 

```jsx
const sleep = await plugin.getTrackableInput('#sleep');
```

### plugin.onRegister(pluginPayload)

Each time Nomie launches, it will register the plugin 

```jsx
plugin.onRegistered(async () => {
  await plugin.storage.init();
  if (!plugin.storage.getItem('apikey')) {
    const res = await plugin.prompt('OpenWeatherMap API Key', 
      `OpenWeatherMap API Required. Get your [FREE API key here](https://home.openweathermap.org/api_keys)`)
    if (res && res.value) {
      plugin.storage.setItem('apikey', res.value);
    }
  }
})
```

### plugin.prompt(title, message)

Request a value from the User. This will bring up Nomie’s prompt alert box with an input field where the user can input a response. 

```jsx
let res = await plugin.prompt('API Key Needed', 'You can get your API Key at [this link](http://somelink)');
if(res.value) {
	console.log(`They provided ${res.value}`)
}
```

### confirm.prompt(title, message)

Ask the user to confirm an action - for example:  Save this Item? 

```jsx
let res = await plugin.confirm('Save this item?', 'You can delete it later');
if(res.value) {
	console.log("They confirmed it");
} else {
	console.log("They DID NOT CONFIRM it");
}
```

### openURL(url, title)

Open any URL in a modal within Nomie. 

```jsx
plugin.openURL('https://nomie.app')
```

# User Preferences

When a plugin is registered it will be passed a set of user preferences for localization, theme and location settings. You can access these preferences from the `plugin.prefs` object

```jsx
console.log(`The week starts on ${plugin.prefs.weekStarts}`);
```

- `plugin.prefs.**theme**`: "light" - user theme
- `plugin.prefs.**use24Hour**`: true or false - does the user prefer 24 hour times
- `plugin.prefs.**useLocation**`: true or false - can we access the users location
- `plugin.prefs.**useMetric**`: true or false - does the user prefer metric
- `plugin.prefs.**weekStarts**`: sunday or monday - first day of the week

# Storage

The Nomie Plugin supports reading and writing to a users Nomie storage engine - within an enclosed folder in the `storage/plugins/{pluginId}`

### plugin.storage.init()

The storage class needs to be initialized which is async, this will pull the latest data and store it in memory. 

```jsx
await plugin.storage.init()
let key = plugin.storage.getItem('weather-api-key');
```

### plugin.storage.getItem(key)

Storage getItem works just like localStorage, except it can return full javascript objects, so you do not need to JSON.parse.

```jsx
let key = plugin.storage.getItem('weather-api-key');
if(key) console.log(`We have a key! ${key}`);
```

### plugin.storage.setItem(key, value)

Storage setItem works just like localStorage, except you can save entire javascript objects, and you do not need to serialize it to a string. 

```jsx
plugin.storage.setItem('weather-api-key', 12345678);
```

## Example Plugins

You can try out the example plugins by copying and pasting the URL provided below in to Nomie’s Plugin manager (More Tab → Plugins)

### Weather

Track the weather one time each day. This plugin will ask the user to get a free API key from OpenWeatherMap, and will record the weather one time a day.  

URL for Nomie:  https://plugins.nomie.app/v1/plugins/weather

### Tester

Will test different features and functions of `nomie-plugin.js` this is completely unhelpful for non-technical people 

URL for Nomie:  https://plugins.nomie.app/v1/plugins/tester

Questions? support@happydata.org 

Copyright 2022 All Rights Reserved. [Happy Data, LLC](https://happydata.org)