/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Memories",
  addToCaptureMenu: true,
  addToMoreMenu: false,
  addToWidgets: true,
  emoji: "📆",
  version: "1.0",
  description: "Multi-year Nomie users can quickly see what happened on this day in your Nomie history",
  uses: [
    "searchNotes",
  ],
});


/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,
    years: [],
    now: plugin.dayjs(),
    mode: 'hidden',
    loading: true
  }),
  async mounted() {
    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(async () => {
      this.mode = 'modal';
      this.loadMemories();
    });

    plugin.onWidget(async () => {
      this.mode = 'widget';
    });

  },
  methods: {
    edit(note) {
      plugin.openNoteEditor(note);
    },
    async loadMemories() {
      this.loading = true;
      let maxEmpty = 3;
      let empties = 0;
      let maxYear = 2014;
      let endYear = parseInt(this.now.format('YYYY'));
      let years = {};
      for(let i=0;i<endYear - maxYear;i++) {
        if(empties <= maxEmpty) {
          let date = plugin.dayjs().subtract(i,'years');
          let notes = await this.getNotes(date);
          if(notes.length === 0) {
            empties = empties + 1;
          } else {
            let justNotes = notes.filter(n=>n.hasNote);
            if(justNotes.length) {
              let year = date.format('YYYY');
              years[year] = years[year] || {
                date,
                year,
                notes: []
              }
              years[date.format('YYYY')].notes = notes.filter(n=>n.hasNote);
            }
          }
        }
      }
      this.years = Object.keys(years).map((year)=>{
        return years[year];
      }).sort((a,b)=>{
        return a.year < b.year ? 1 : -1
      })
      this.loading = false;
    },  
    async getNotes(date) {
      const notes = await plugin.searchNotes('', date.toDate(), 1);
      return notes;
    }
  },
}).$mount("#content");
