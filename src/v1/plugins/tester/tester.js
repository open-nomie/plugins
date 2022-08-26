/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Tester Plugin",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  addToWidgets: true,
  emoji: "🛠",
  version: "1.0",
  description: "Tester Plugin",
  uses: [
    // NOTE: if you change these, you will need to reinstall this plugin in Nomie
    "createNote", // Create a new Note in Nomie
    "onLaunch", //
    "onNote",
    "getTrackableUsage",
    "searchNotes",
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

/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,
    trackables: [],
  }),
  async mounted() {
    /**
     * On Launch
     * Gets fired each time the user opens Nomie
     */
    plugin.onLaunch(() => {
      log("✅ Nomie Launched Fired");
    });

    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(async () => {
      log("✅ Nomie UI Opened Fired");
    });

    plugin.onNote((note) => {
      log("✅ Nomie onNote Fired");
      log("Note text", note.note);
      log("Note Date", note.end);
      log("Note Score", note.score);
      log("All Data", note);
    });

    plugin.onRegistered(async () => {
      log("✅ Tester Plugin Registered");
      plugin.storage.init().then(() => {
        log("✅ Plugin Storage initialized");
      });
    });
  },
  methods: {
    openURL() {
      plugin.openURL("https://nomie.app", "Nomie Website");
    },
    openTemplate() {
      plugin.openTemplateURL(`${window.location.origin}/v1/plugins/tester/template-test.json`);
    },
    async confirmTest() {
      const confirmed = await plugin.confirm("Can you please confirm?","Message should support **markdown**")
      if(confirmed.value) {
        await plugin.alert('You confirmed it!')
      } else {
        await plugin.alert('You DID NOT confirm it!')
      }
    },
    createNote() {
      plugin.createNote({
        note: "This is a test note!",
        score: 3,
      });
    },
    async searchNotes() {
      const keyword = await plugin.prompt("Search Term");
      const daysBack = 30;
      if (keyword.value) {
        console.log({ keyword });
        let notes = await plugin.searchNotes(
          keyword.value,
          new Date(),
          daysBack
        );
        plugin.alert(`Found ${notes.length} notes`,
          `There are ${notes.length} notes with the term **${keyword.value}** over the last ${daysBack}`
        );
      }
    },
    async selectTrackables() {
      const selected = await plugin.selectTrackables();
      await plugin.alert(`You selected ${selected.length} trackables!`);
    },
    async selectTrackableAndValue() {
      let selected = await plugin.selectTrackable('tracker');
      if (selected.length) {
        let trackable = selected[0];
        console.log({ trackable });
        let res = await plugin.getTrackableInput(trackable.id);
        let value = undefined;
        if (res && res.value) {
          trackable.value = res.value;
        }
        this.trackables.push(trackable);
      }
    },
  },
}).$mount("#content");
