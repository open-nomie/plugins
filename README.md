# Nomie6-oss Plugins [WIP]

Nomie Plugins allows people who are familiar with HTML and Javascript to create entirely new methods of tracking and monitoring data within Nomie6-oss.

## Introduction

Nomie Plugins use iframes to load and communicate with “plugins”. So this really just means, a plugin is a hosted HTML page, that has some extra javascript to request data to and from Nomie. We do this by using postMessage and window.onMessage to securely pass data between Nomie and your Plugin.

### Resources

**Repo** [https://github.com/open-nomie/plugins](https://github.com/open-nomie/plugins/)

**Nomie6-oss on GitHub Pages**: [https://open-nomie.github.io](https://open-nomie.github.io/)

# nomie-plugin.js

This library abstracts the responsibility of posting messages and listening for messages into simple async calls. This document outlines the specific functions of `nomie-plugin.js`.

### Including the nomie-plugin.js library

```jsx
<script src="https://cdn.jsdelivr.net/gh/open-nomie/plugins/bin/v1/nomie-plugin.js">
```

## new NomiePlugin( {pluginDetails})

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
	console.log("Note Elements (raw trackable data)", note.elements)
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

### plugin.openTemplateURL(url)

Open the URL of a template within Nomie.

```jsx
plugin.openTemplateURL('https://6.nomie.app/templates/adhd-template.json');
```

### plugin.getTrackableUsage( {tag, endDate, daysBack })

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

### plugin.selectTrackables(type)

Select multiple Trackables

`uses: [’selectTrackables’]` is required for this method

- **type**: undefined | tracker | context | person  - the type of trackables to show the user
- **multiple**: true | false  -  if the user can select multiple trackables or not
- **returns**: Promise<Array<trackables>>

```jsx
const mutipleTrackables = await plugin.selectTrackables(null, true);
const justOneTrackable = await plugin.selectTrackables(null);
const justAPersonTrackable = await plugin.selectTrackables('person');
```

### plugin.selectTrackable(type)

Selects a single Trackable

`uses: [’selectTrackables’]` is required for this method

- **type**: undefined | tracker | context | person  - the type of trackables to show the user
- **returns**: Promise<Trackable>

```jsx
const justAPersonTrackable = await plugin.selectTrackable('person');
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

### plugin.openNoteEditor(str | noteObject)

Open up Nomie’s full size Note editor for a given note.

```jsx
plugin.openNoteEditor("Just as a string");
// or
plugin.openNoteEditor({ note: 'this is a note', lat: 34, lng: -81, score: 2 })
```

### plugin.prompt(title, message)

Request a value from the User. This will bring up Nomie’s prompt alert box with an input field where the user can input a response.

```jsx
let res = await plugin.prompt('API Key Needed', 'You can get your API Key at [this link](http://somelink)');
if(res.value) {
	console.log(`They provided ${res.value}`)
}
```

### plugin.confirm(title, message)

Ask the user to confirm an action - for example:  Save this Item?

```jsx
let res = await plugin.confirm('Save this item?', 'You can delete it later');
if(res.value) {
	console.log("They confirmed it");
} else {
	console.log("They DID NOT CONFIRM it");
}
```

### plugin.alert(title, message)

Alert the user that something happened. It’s a better experience than just the browsers default alert()

```jsx
plugin.alert('This item was deleted', 'It is gone forever.');

```

### openURL(url, title)

Open any URL in a modal within Nomie.

```jsx
plugin.openURL('https://nomie.app')
```

---

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
- `plugin.prefs.**language**`: the users selected language (en-us);

---

# Storage

The Nomie Plugin supports reading and writing to a users Nomie storage engine - within an enclosed folder in the `storage/plugins/{pluginId}`

### plugin.storage.init()

The storage class **needs to be initialized** which is async, this will pull the latest data and store it in memory.

```jsx
await plugin.storage.init()
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

---

# Multiple Widgets

In some cases you would like to enable multiple different widgets for the same plugin. You can enable this as per below instructions.

### Widget Storage Settings

In order to enable multiple widgets you need to register the different widgets in the Nomie Storage Engine for your plugin like the below example:

```jsx
let Widgets = [{"widgetid":"1", "name":"Widget1","emoji":"🥴","config":{"wctext":"This is Widget 1"}},{"widgetid":"2", "name":"Widget2”, "emoji":"👌","config":{"wctext":"This is Widget 2"}}];
plugin.storage.setItem('widgets',Widgets);
```

In above example we register 2 widgets. The fields widgetid, name and emoji are mandatory and will be used by Nomie to list the widgets as available widgets for this plugin. Any other fields (in above example the config object) can be added in support of your plugin.

When adding widgets to the Nomie dashboard, users will get the list of configured widgets. Nomie will use the widgetid as parameter in the url when the widget is loaded in the dashboard.

So in above example, when the user added the second widget to the dashboard, the url which will be used for this widget is: www.plugindomain.com/?widgetindex=2

You can use the following code to get the the value for the widgetindex parameter. Once you have the widgetindex value, you can use this in your plugin to direct the code to that specific widget.

```jsx
let WidgetIndex;
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has("widgetindex")){
    WidgetIndex = urlParams.get("widgetindex");
}
```

Please refer to the ☁️WordCloud or 💬Quote Plugins in below available plugin list for examples how this can be implemented.

# Available Plugins

You can install the plugins by copying and pasting the URL provided below in to Nomie’s Plugin manager (More Tab → Plugins)


| PLUGIN                         | DESCRIPTION                                                                                                                                               | SOURCE CODE                                                                                                                                              | URL FOR NOMIE                                                                                                              |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 💨 Nomie Weather               | Track the weather one time each day. This plugin will ask the user to get a free API key from OpenWeatherMap, and will record the weather one time a day. | [https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/weather](https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/weather)     | https://dailynomie.github.io/nomie-plugins/v1/plugins/weather                                                              |
| 👨‍👩‍👧‍👦 Nomie My People | Keep up with the people that matter the most                                                                                                              | [https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/my-people](https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/my-people) | https://dailynomie.github.io/nomie-plugins/v1/plugins/my-people                                                            |
| 🧘🏽‍♀️ Nomie Meditate      | Follow Guided Meditations                                                                                                                                 | [https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/meditate](https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/meditate)   | https://dailynomie.github.io/nomie-plugins/v1/plugins/meditate                                                             |
| 📆 Nomie Memories              | Multi-year Nomie users can quickly see what happened on this day in your Nomie history                                                                    | [https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/memories](https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/memories)   | https://dailynomie.github.io/nomie-plugins/v1/plugins/memories                                                             |
| 🪝 Nomie Api                   | Api client for Nomie which enables you to remotely inject logs into Nomie                                                                                 | [https://github.com/RdeLange/nomie-plugin-api](https://github.com/RdeLange/nomie-plugin-api)                                                             | [https://dailynomie.github.io/nomie-plugin-api/](https://dailynomie.github.io/nomie-plugin-api/)                           |
| 🧱 Nomie Blockly               | Use Google Blockly to visually program your own code which interacts with Nomie. You can pull data aswell as push logs                                    | [https://github.com/RdeLange/nomie-plugin-blockly](https://github.com/RdeLange/nomie-plugin-blockly)                                                     | [https://dailynomie.github.io/nomie-plugin-blockly/](https://dailynomie.github.io/nomie-plugin-blockly/)                   |
| ⚖️ Nomie My Balance          | Define categories to measure your data, (auto) calculate your achievements by predefined algorithms and visualise as a Wheel of Life                      | [https://github.com/RdeLange/nomie-plugin-mybalance](https://github.com/RdeLange/nomie-plugin-mybalance)                                                 | [https://dailynomie.github.io/nomie-plugin-mybalance/](https://dailynomie.github.io/nomie-plugin-mybalance/)               |
| 🫁 Nomie Breathe               | Follow Guided Breathe Sessions                                                                                                                            | [https://github.com/RdeLange/nomie-plugin-breathe](https://github.com/RdeLange/nomie-plugin-breathe)                                                     | [https://dailynomie.github.io/nomie-plugin-breathe/](https://dailynomie.github.io/nomie-plugin-breathe/)                   |
| ⏲ Nomie Fasting               | Track your Fast period and log your achievements                                                                                                          | [https://github.com/RdeLange/nomie-plugin-fast](https://github.com/RdeLange/nomie-plugin-fast)                                                           | [https://dailynomie.github.io/nomie-plugin-fast/](https://dailynomie.github.io/nomie-plugin-fast/)                         |
| ⌚️ Nomie Apple Watch         | Enable logging data and notes via your Apple Watch                                                                                                        | [https://github.com/RdeLange/nomie-plugin-applewatch](https://github.com/RdeLange/nomie-plugin-applewatch)                                               | In development                                                                                                             |
| 💪 Nomie 7mins Workout         | Follow Guided 7 Minutes Workouts                                                                                                                          | [https://github.com/RdeLange/nomie-plugin-7minwo](https://github.com/RdeLange/nomie-plugin-7minwo)                                                       | [https://dailynomie.github.io/nomie-plugin-7minwo/](https://dailynomie.github.io/nomie-plugin-7minwo/)                     |
| ☁️ Nomie WordCloud           | Add WordCloud to your Nomie Dashboard                                                                                                                     | [https://github.com/RdeLange/nomie-plugin-widget-wordcloud](https://github.com/RdeLange/nomie-plugin-widget-wordcloud)                                   | [https://dailynomie.github.io/nomie-plugin-widget-wordcloud/](https://dailynomie.github.io/nomie-plugin-widget-wordcloud/) |
| 💬 Nomie Quotes                | Add random daily Quotes to your Nomie Dashboard                                                                                                           | [https://github.com/RdeLange/nomie-plugin-widget-quotes](https://github.com/RdeLange/nomie-plugin-widget-quotes)                                         | [https://dailynomie.github.io/nomie-plugin-widget-quotes/](https://dailynomie.github.io/nomie-plugin-widget-quotes/)       |
| 🛠 Tester                      | Tester plugin for developers. Will test different features and functions of`nomie-plugin.js` this is completely unhelpful for non-technical people        | [https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/tester](https://github.com/open-nomie/plugins/tree/master/src/v1/plugins/tester)       | https://dailynomie.github.io/nomie-plugins/v1/plugins/tester                                                               |

---

# Installing a Plugin

1. Go to the More Tab
2. Select Plugins
3. Click the + or Add Custom Plugin
4. Provide the url for the plugin
5. Tap Install Plugin

---

# Testing Local Plugins within Nomie

By default browsers do not let insecure iframes to be called from a secure frame.

in order to test your local plugin within [https://open-nomie.github.io](https://open-nomie.github.io/) you will need to tell your browser to allow insecure content for Nomie’s domain.  Follow these instructions to make that change [https://experienceleague.adobe.com/docs/target/using/experiences/vec/troubleshoot-composer/mixed-content.html?lang=en](https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Fexperienceleague.adobe.com%2Fdocs%2Ftarget%2Fusing%2Fexperiences%2Fvec%2Ftroubleshoot-composer%2Fmixed-content.html%3Flang%3Den&data=05%7C01%7C%7Caecea11047764815a08508da83a24eef%7C84df9e7fe9f640afb435aaaaaaaaaaaa%7C1%7C0%7C637967030376426601%7CUnknown%7CTWFpbGZsb3d8eyJWIjoiMC4wLjAwMDAiLCJQIjoiV2luMzIiLCJBTiI6Ik1haWwiLCJXVCI6Mn0%3D%7C3000%7C%7C%7C&sdata=T3RMGxJYNwJYXdDPgWgky%2FJPidtVp2BKy0L5ewqKpr0%3D&reserved=0)

---

**Copyright 2023 All Rights Reserved.**
