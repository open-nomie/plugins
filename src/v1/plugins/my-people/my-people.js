

/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "My People",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  emoji: "👨‍👩‍👧‍👦",
  version: "0.5",
  description: "Keep up with the people that matter the most.",
  uses: ['createNote', 'selectTrackables', 'searchNotes'],
});


const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}

const strToTagSafe = (str) => {
  return str
    .replace(/(\@|\+\#)/gi, '')
    .trim()
    .replace(/[^A-Z0-9]/gi, '_')
    .toLowerCase()
}



const AvatarComponent = Vue.component('person-item', {
  props: ['avatar', 'name', 'size'],
  methods: {

  },
  template: `
  <div class="nui-avatar inline-flex justify-center items-center rounded-full bg-cover bg-center nui-bg-primary" 
      :style="{ width: size + 'px', height:size + 'px', backgroundImage: avatar ? 'url('+avatar+')' : '' }">
    <div 
      v-if="!avatar"
      :style="{fontSize: size * 0.50 + 'px'}"
      class="flex items-center uppercase font-semibold nui-text-solid">
      {{(name || "").replace('@','').substring(0,2)}}
    </div>
  </div>
  `
})

/* It's a Vue component that is used to render a person. */
const PersonItem = Vue.component('person-item', {
  props: ['person'],
  methods: {
    dayjs(date) {
      return plugin.dayjs(date);
    }
  },
  components: {
    'avatar': AvatarComponent
  },
  template: `
  <button class="nui-item space-x-4" @click="$emit('click',person)">
    <avatar :avatar="person.avatar" :name="person.name" size="42" />
    <main class="nui-filler py-1">
      <h2 class="nui-title solid">
        {{person.displayName || username}}
      </h2>
      <p class="text-sm nui-text-600 font-normal" v-if="person.latest">
        {{dayjs(person.latest).fromNow()}}
      </p>
      <p class="text-sm nui-text-600 font-normal" v-else>
        No recent contact
      </p>
    </main>
    
    <div v-if="[1,2,3].indexOf(person.noContactScore) > -1" class="text-orange-500">🕐</div>
    <div v-if="person.noContactScore < 1" class="text-gray-500">⚠️</div>
  </button>
  `
})

/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,
    mode: 'hidden',
    loading: true,
    activePerson: undefined,
    editingPerson: undefined,
    activePersonView: 'info',
    people: {},
    notes: [],
    status: '',
    saving: false,
    checkInNote: '',
    inNomie: true,
    sort: localStorage.getItem('mp-sort') || 'attention'
  }),
  components: {
    'person-item': PersonItem,
    'avatar': AvatarComponent
  },
  async mounted() {
    document.body.classList.remove('loading');
    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(async () => {
      this.mode = 'modal';
    });

    plugin.onRegistered(async () => {
      await plugin.storage.init()
      this.inNomie = true;
      this.loading = false;
      let fromStorage = plugin.storage.getItem('people') || {};
      Object.keys(fromStorage).map(username => {
        fromStorage[username] = new Person(fromStorage[username]);
      })
      this.people = fromStorage;

      const latest = await this.getLatest();

    })

    setTimeout(() => {
      if (this.loading) {
        this.inNomie = false;
      }
    }, 700);

  },
  computed: {
    peopleArray() {
      return Object.keys(this.people || {}).map((username) => {
        return this.people[username];
      })
    },
    cleanPhone() {
      return this.activePerson.phone.replace(/[^a-z0-9]/g, '')
    },


    everyoneElse() {
      const stripName = (n) => {
        return `${n || ''}`.replace('@', '');
      }
      return this.peopleArray.filter((p) => {
        // return !p.isBirthday && p.noContactScore > 2;
        return true;
      }).filter(p => !p.hidden).sort((a, b) => {

        if (this.sort == 'oldest') {
          return a.latest > b.latest ? 1 : -1;
        } else if (this.sort == 'newest') {
          return a.latest < b.latest ? 1 : -1
        } else if (this.sort == 'a-z') {
          return stripName(a.name).toLowerCase() > stripName(b.name).toLowerCase() ? 1 : -1
        } else if (this.sort == 'z-a') {
          return stripName(a.name).toLowerCase() < stripName(b.name).toLowerCase() ? 1 : -1
        } else if (this.sort == 'attention') {

          return a.noContactScore > b.noContactScore ? 1 : -1
        }
        return true;
      })
    },
    checkinOptions() {
      return [
        {
          label: 'Lunch',
          note: `Lunch with @${this.activePerson.username} `
        },
        {
          label: 'Dinner',
          note: `Dinner with @${this.activePerson.username} `
        },
        {
          label: 'Phone Call',
          note: `Phone Call with @${this.activePerson.username} `
        },
        {
          label: 'Virtual Meeting',
          note: `Virtual meeting with @${this.activePerson.username} `
        },
        {
          label: 'Text/SMS',
          note: `Texted with @${this.activePerson.username} `
        },
        {
          label: 'Email',
          note: `Emailed @${this.activePerson.username} `
        },
        {
          label: 'Drinks',
          note: `Drinks with @${this.activePerson.username} `
        },
        {
          label: 'Meeting',
          note: `Meeting with @${this.activePerson.username} `
        },
        {
          label: 'Hung-out',
          note: `Hung out with @${this.activePerson.username} `
        },
        {
          label: 'Other',
          note: `With @${this.activePerson.username} `
        },
      ]
    },
    birthdayArray() {
      return this.peopleArray.filter(p => p.isBirthday);
    },
    activePersonNotes() {
      return this.notes.filter((note) => {
        return note.elements.find(e => {
          return e.id == this.activePerson.username;
        })
      })
    },
    needsAttention() {
      return this.peopleArray.filter((p) => {
        return !p.isBirthday && p.noContactScore <= 2
      }).sort((a, b) => {
        return a.noContactScore > b.noContactScore ? 1 : -1
      })
    }
  },
  watch: {
    "editingPerson.displayName"() {
      if (this.editingPerson && this.editingPerson.dirty) {
        this.editingPerson.username = strToTagSafe(this.editingPerson.displayName);
      }
    }
  },
  methods: {
    dayjs(date) {
      return plugin.dayjs(date);
    },
    createPerson() {
      this.editingPerson = new Person({});
    },
    setNoContactDays(evt) {
      const value = evt.target.value;
      let person = new Person(this.activePerson);
      person.maxNoContactDays = value;
      this.upsertPerson(person);
    },
    postActionPrompt(type) {
      this.activePersonView = 'check-in';
      this.checkInNote = `${type} @${this.activePerson.username} `;

    },
    setSort(evt) {
      const value = evt.target.value
      localStorage.setItem('mp-sort', value);
    },
    async saveNote() {
      this.saving = true;
      await wait(200);
      if (this.activePerson && this.checkInNote) {
        this.activePerson.latest = new Date();
        await plugin.createNote(this.checkInNote);
        this.clearActivePerson();
        this.saving = false;
        await wait(100);
        this.getLatest();
      }
    },
    clearActivePerson() {
      this.checkInNote = "";
      this.activePerson = undefined;
    },
    addToNote(str) {
      this.checkInNote = [this.checkInNote, str].join(' ');
    },
    /**
     * Get 30 days of notes
     * extract @people to compile the this.people
     * @returns 
     */
    async getLatest() {
      let hasChanges = false;
      // Search all notes
      const allNotes = await plugin.searchNotes('', new Date(), 30);
      // Filter out only notes with elements that have a person
      const peopleNotes = allNotes.filter(note => {
        return note.elements.find(e => e.type == 'person')
      })
      // Create a standalone object
      const allPeople = { ...this.people };
      // Loop over the people notes
      peopleNotes.forEach((note) => {
        // Loop over the elements of the notes
        // filter out on people
        note.elements.filter(e => e.type == 'person').forEach((ele) => {
          // If allPeople[username] DOES NOT EXIST
          if (!allPeople.hasOwnProperty(ele.id)) {
            allPeople[ele.id] = new Person({
              username: ele.id,
              displayName: ele.raw,
              latest: note.end
            })
            hasChanges = true;
          } else {
            // AllPeople[username] exists
            // Get this note date
            const noteDate = new Date(note.end);
            // Get last note date
            const lastUserDate = allPeople[ele.id].latest || '1960-01-01';
            const latest = new Date(lastUserDate);

            // Is latest less than this note date?
            if (latest < noteDate) {
              hasChanges = true;
              // yes, update the latest to this notes date
              allPeople[ele.id].latest = note.end;
            }
          }
        })
      })
      // Push allPeople to vue this.people
      this.people = allPeople;
      this.notes = peopleNotes;
      // If has changes = save the 
      if (hasChanges) this.saveStorage();
      return this.notes;

    },
    async openPerson(person) {
      this.activePerson = person;
      this.checkInNote = `@` + person.username + ' '
    },
    /**
     * Edit a Person - open Modal
     * @param {Person} person 
     */
    async editPerson(_person) {
      const person = new Person(_person);
      const tag = `@${person.username}`;
      if (!person.displayName || !person.avatar) {
        const value = await plugin.getTrackable(tag);
        const trackable = value.trackable;

        if (trackable) {
          person.displayName = trackable.person.displayName;
          person.avatar = trackable.person.avatar;
          person.notes = person.notes || trackable.person.notes;
        }
      }

      await wait(100);
      this.editingPerson = person
    },
    openInNomie(person) {
      plugin.openTrackableEditor(person.asTrackable)
    },
    /**
     * Save a Person to the plugin database
     * @param {Person} person 
     */
    savePerson(person) {
      try {
        // If new Person (not in Nomie)
        if (person.dirty) {
          person.dirty = false;
          plugin.openTrackableEditor(person.asTrackable)
        }
        this.upsertPerson(person);

        // If we have the active Person open while editing
        if (this.activePerson && this.activePerson.username == this.editingPerson.username) {
          this.openPerson(new Person(person));
        }

        // Clear Editing State
        this.editingPerson = undefined;
      } catch (e) {
        alert(e.message);
      }
    },
    /**
     * Add or Update Person to the plugin database
     * @param {Person} person 
     */
    upsertPerson(person) {
      if (!person instanceof Person) throw error('Must be a person class to upsert a person');
      let allPeople = { ...this.people };
      let current = allPeople[person.username];
      if (current) {
        allPeople[person.username] = new Person({ ...current, ...person });
      } else {
        allPeople[person.username] = person;
      }
      this.people = allPeople;

      plugin.storage.setItem('people', this.people);

    },
    async deletePerson(person) {
      const confirmed = await plugin.confirm(`Delete ${person.username} from the My People plugin?`, 'This will not remove them from Nomie');
      if (confirmed.value === true) {
        if (person == this.activePerson) this.activePerson = undefined;

        const allPeople = { ...this.people };
        delete allPeople[person.username];
        plugin.storage.setItem('people', allPeople);
        this.people = allPeople;
      }
    },
    saveStorage() {
      plugin.storage.setItem('people', this.people);
    },
    async selectPersonTrackable() {
      let selected = await plugin.selectTrackable('person');
      if (selected) {
        let person = new Person(selected.person);
        this.upsertPerson(person);
      }
    }
  },

}).$mount("#app");
