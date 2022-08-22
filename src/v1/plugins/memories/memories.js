/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Memories",
  addToCaptureMenu: true,
  addToMoreMenu: false,
  addToWidgets: false,
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
    loading: true,
    status: '',
    inNomie: false
  }),
  computed: {
    yearsArray() {
      const arrayMap = Object.keys(this.years).map((year)=>{
        return this.years[year];
      }).sort((a,b)=>{
        return a.year < b.year ? 1 : -1
      })
      return arrayMap
    }
  },
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
      this.loadMemories();
    });

    plugin.onRegistered(()=>{
      this.inNomie = true;
    })

    // Lets wait 6 seconds and if we're not in nomie, 
    setTimeout(()=>{
      if(!this.inNomie) this.error = 'Sorry, Memories will only inside of Nomie.app';
    },4000);

  },
  methods: {
    edit(note) {
      plugin.openNoteEditor(note);
    },
    async loadMemories() {
      this.loading = true;
      this.status = 'Looking...';
      let maxEmpty = 3;
      let empties = 0;
      let maxYear = 2014;
      const endDate = this.now.subtract(1,'year');
      let endYear = parseInt(endDate.format('YYYY'));
      let years = {};
      
      // Loop over the years 
      for(let i=0;i<endYear - maxYear;i++) {
        // Only run if we have less than Max Empty
        if(empties <= maxEmpty) {

          // Get last years date
          let date = endDate.subtract(i,'years');
          // Set Status
          this.status = `Looking at ${date.format('YYYY')}`
          // Get Notes for Date
          let notes = await this.getNotes(date);
          // If no notes - increase empty 
          if(notes.length === 0) {
            empties = empties + 1;
          } else {
            // Filter out just notes 
            let justNotes = notes.filter(n=>n.hasNote);
            // If we have some add them to year map
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

      // Order years by newest first
      this.years = Object.keys(years).map((year)=>{
        return years[year];
      }).sort((a,b)=>{
        return a.year < b.year ? 1 : -1
      })
      
      // Clear Status
      this.status = '';
      this.loading = false;
    },  
    async getNotes(date) {
      const notes = await plugin.searchNotes('', date.toDate(), 0);
      return notes;
    }
  },
  
}).$mount("#content");
