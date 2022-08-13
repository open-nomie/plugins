/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Let's Eat!",
  addToCaptureMenu: true,
  addToWidgets: true,
  emoji: "🍔",
  version: "1.0",
  description: "Food and Nutrition Tracking",
  uses: [
    // NOTE: if you change these, you will need to reinstall this plugin in Nomie
    "createNote",
    "selectTrackables",
    "getTrackable",
    "getLocation",
  ],
});

const log = (v1, v2, v3, v4) => {
  console.log(
    `👋👋👋 Tester Plugin:`,
    v1 ? v1 : "",
    v2 ? v2 : "",
    v3 ? v3 : "",
    v4 ? v4 : ""
  );
};

let searchDebounce;

/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,
    results: [],
    selected: [],
    searchTerm: "Burger",
    nutrients: undefined,
    apikey: undefined,
  }),
  watchers: {
    searchTerm() {
      console.log(this.searchTerm);
    },
  },
  async mounted() {
    plugin.storage.init().then(async () => {
      const key = await plugin.storage.getItem("apikey");
      console.log("KEY From Storage", key);
      if (!key) {
        let newKey = await this.requestKey();

        if (newKey) {
          plugin.storage.setItem("apikey", newKey);
          this.apikey = newKey;
        }
      } else {
        this.apikey = key;
        this.queryFood();
      }
    });

    /**
     * On Launch
     * Gets fired each time the user opens Nomie
     */
    // plugin.onLaunch(() => {
    //   log('✅ Nomie Launched Fired')
    // });

    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(async () => {});

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
  methods: {
    selectFood(food) {
      if(!this.selected.includes(food)) {
        this.selected.push(food)
      }
      this.selected = this.selected;
      console.log("Select this", food, this.selected);
      this.nutrients = this.generateNutrients()
    },
    async queryFood() {
      if (this.searchTerm) {
        let url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(
          this.searchTerm
        )}&pageSize=20&api_key=${this.apikey}`;
        let call = await fetch(url);
        let data = await call.json();
        console.log("food data", data);
        if (data.foods) {
          this.results = data.foods;
          this.results = this.results.map((food)=>{
            let cals = food.foodNutrients.find(n=>n.nutrientName == 'Energy');
            if(cals) {
              food.cals = cals.value;
            }
            return food;
          })
        }
      } else {
        this.results = [];
      }
    },
    search(evt) {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        this.queryFood();
      }, 500);
    },
    async requestKey() {
      const res = await plugin.prompt(
        "USDA API Key",
        `You need a valid USDA API key to use this plugin. [Get your free API Key here](https://fdc.nal.usda.gov/api-key-signup.html)`
      );
      console.log({ res });
      if (res && res.value) {
        console.log({ key: res.value });
        return res.value;
      }
      return undefined;
    },
    generateNutrients() {
      const foodNutrients = this.selected.map(f=>f.foodNutrients);
      console.log({nutrients: foodNutrients.map(ni=>ni.map(n=>n.nutrientName))});

      // nutrients.map(ni=>ni.map(n=>{
      //   map[n.nutrientName] = map[n.nutrientName] || { 
      //     values: [],
      //     unit: n.unitName
      //   };
      //   if(n.unitName !== 'IU') {
      //     map[n.nutrientName].values.push(n.value);
      //   }
      // }))

      const findNut = (term) => {

        let nuts = nutrients.find(n=>{
          
        })

        let filtered = Object.keys(map).filter(name=>{
          return name.toLowerCase().search(term.toLowerCase()) > -1 && name.toLowerCase().search('International Units') == -1
        }).map(name=>{
          let node = map[name];
          return {
            value: node.values.reduce((a, b) => {
              let a1 = isNaN(a) ? 0 : a;
              let b1 = isNaN(b) ? 0 : b;
              return a1 + b1;
            }, 0),
            unit: map[name].unit
          }
        })
        console.log(term, {filtered});
        if(filtered.length) {
          return {
            unit: filtered[0].unit,
            value: filtered.length > 1 ? filtered.reduce((a,b)=> {
              return a.value + b.value
            }, 0) : filtered[0].value
          };
        }
      }

      const final = [];
      let protein = findNut('protein');
      
      if(protein) final.push({ name: 'Protein', value: protein.value, unit: protein.unit })

      let energy = findNut('energy');
      if(energy) final.push({ name: 'Energy', value: energy.value, unit: energy.unit })

      let fiber = findNut('fiber');
      if(fiber) final.push({ name: 'Fiber', value: fiber.value, unit: fiber.unit })

      let sugar = findNut('sugar');
      if(sugar) final.push({ name: 'Sugars', value: sugar.value, unit: sugar.unit })

      console.log({map, final});

      return final;
    }
  },
}).$mount("#app");
