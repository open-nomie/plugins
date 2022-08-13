/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Tester Plugin",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  addToWidgets: true,
  emoji: "🛠",
  version: "1.0",
  description: "Tester Plugin",
  uses: [ // NOTE: if you change these, you will need to reinstall this plugin in Nomie
    "createNote", // Create a new Note in Nomie
    "onLaunch", // 
    "onNote",
    "getTrackableUsage",
    "searchNotes",
    "createNote",
    "selectTrackables",
    "getTrackable",
    "getLocation",
  ],
});

const log = (v1,v2,v3,v4) => {
  console.log(`👋👋👋 Tester Plugin:`, v1 ? v1 : '', v2 ? v2 : '', v3 ? v3 : '', v4 ? v4 : '');
}

/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,

  }),
  async mounted() {
    plugin.storage.init().then(()=>{
      log('✅ Plugin Storage initialized')
    })

    /**
     * On Launch
     * Gets fired each time the user opens Nomie
     */
    plugin.onLaunch(() => {
      log('✅ Nomie Launched Fired')
    });

    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(async () => {
      log('✅ Nomie UI Opened Fired')
      const trackable = await plugin.getTrackable('#mood');
      log("mood", trackable);
      const cider = await plugin.getTrackableInput('#cider');
      const sleep = await plugin.getTrackableInput('#sleep');
      const mom = await plugin.getTrackableInput('@mom');
      const mj = await plugin.getTrackableInput('+mj');
      console.log({cider, sleep, mom, mj});
      
    });

    /**
     * When the Plugin is Registered
     * Check if we have an API key for OpenWeatherMap
     * if not, prompt the user for the api
     */
    // plugin.onRegistered(async () => {
    //   await plugin.storage.init();
    //   if (!plugin.storage.getItem('apikey')) {
    //     const key = await plugin.prompt('OpenWeatherMap API Key',
    //       `OpenWeatherMap API Required. Get your [FREE API key here](https://home.openweathermap.org/api_keys)`)
    //     if (key && key.value) {
    //       plugin.storage.setItem('apikey', key.value);
    //     }
    //   }
    // })
  },
  async unmounted() {
    console.log("unmounted weather");
  },
  methods: {},
}).$mount("#content");
