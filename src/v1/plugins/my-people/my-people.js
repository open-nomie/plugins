/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "My People",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  emoji: "👨‍👩‍👧‍👦",
  version: "0.2",
  description: "Keep up with the people that matter the most.",
  uses: ['createNote', 'selectTrackables', 'searchNotes'],
});

class Person {
  constructor(starter = {}) {
    this.username = starter.username;
    this.displayName = starter.displayName;
    this.birthday = starter.birthday;
    this.frequency = starter.frequency
    this.notes = starter.notes
    this.avatar = starter.avatar
    this.latest = starter.latest
    this.hidden = starter.hidden ? true : false;
    this.email = starter.email;
    this.phone = starter.phone;
    this.maxNoContactDays = starter.maxNoContactDays;
  }

  get age() {
    if (this.birthday) {
      return plugin.dayjs().diff(this.birthdate, 'years');
    }
  }

  get name() {
    return this.displayName || this.username;
  }

  get birthdate() {
    if (this.birthday) {
      return plugin.dayjs(new Date(`${this.birthday}T12:00:00`));
    }
  }

  get noContactScore() {
    if (this.maxNoContactDays) {
      let last = plugin.dayjs(this.latest || '2001-01-01');
      let daysDiff = plugin.dayjs().diff(last, 'days')
      if (daysDiff >= this.maxNoContactDays) {
        return 1;
      } else if ((daysDiff * 1.5) >= this.maxNoContactDays) {
        return 0.5;
      }
    } else {
      return -1;
    }
  }

  get isBirthday() {
    if (this.birthday) {
      const now = plugin.dayjs();
      let birthdate = this.birthdate.year(now.year());
      return birthdate.toDate().toDateString() == now.toDate().toDateString();
    } else {
      return false;
    }
  }

  get nextBirthdate() {
    let now = plugin.dayjs();
    let birthdate = this.birthdate;

    if (birthdate.year(now.year()).toDate().getTime() < new Date().getTime()) {
      birthdate = birthdate.year(now.add(1, 'year').year());
    } else {
      birthdate = birthdate.year(now.year());
    }
    return birthdate;
  }

  get birthdayFromNow() {
    if (this.birthday) {
      let next = this.nextBirthdate;
      return next.diff(plugin.dayjs(), 'days');
    }
  }

  get birthdayFormatted() {
    if (this.birthday) {
      return this.nextBirthdate.format('Do MMM');
    }
  }
}

const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
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
      console.log({ latest });
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
      }).filter(p => !p.hidden)
    },
    everyoneElse() {
      return this.peopleArray.filter((p) => {
        return !p.isBirthday && p.noContactScore !== 1;
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
        return !p.isBirthday && p.noContactScore > 0
      }).sort((a, b) => {
        return a.noContactScore > b.noContactScore ? 1 : -1
      })
    }
  },
  methods: {
    dayjs(date) {
      return plugin.dayjs(date);
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
    async getLatest() {
      let hasChanges = false;
      const allNotes = await plugin.searchNotes('', new Date(), 30);
      const peopleNotes = allNotes.filter(note => {
        return note.elements.find(e => e.type == 'person')
      })
      const allPeople = { ...this.people };
      peopleNotes.forEach((note) => {
        note.elements.filter(e => e.type == 'person').forEach((ele) => {
          if (!allPeople.hasOwnProperty(ele.id)) {
            allPeople[ele.id] = new Person({
              username: ele.id,
              displayName: ele.raw,
              latest: note.end
            })
          } else {

            const noteDate = new Date(note.end);
            const latest = new Date(allPeople[ele.id].latest);

            if (latest < noteDate) {
              console.log("🔥🔥🔥🔥🔥🔥🔥")
              hasChanges = true;
              allPeople[ele.id].latest = note.end;
            }
          }
        })
      })
      this.people = allPeople;
      this.notes = peopleNotes;
      if (hasChanges) this.saveStorage();
      return this.notes;

    },
    async openPerson(person) {
      this.activePerson = person;
    },
    async editPerson(_person) {

      const person = new Person(_person);
      const tag = `@${person.username}`;
      if (!person.displayName || !person.avatar) {
        const value = await plugin.getTrackable(tag);
        const trackable = value.trackable;
        console.log({ edit: trackable });
        if (trackable) {
          person.displayName = trackable.person.displayName;
          person.avatar = trackable.person.avatar;
          person.notes = person.notes || trackable.person.notes;
        }
      }

      await wait(100);
      this.editingPerson = person
    },
    savePerson(person) {
      this.upsertPerson(person);
      if (this.activePerson.username == this.editingPerson.username) {
        this.openPerson(new Person(person));
      }
      this.editingPerson = undefined;
    },
    upsertPerson(person) {
      if (!person instanceof Person) throw error('Must be a person class to upsert a person');
      let current = this.people[person.username];
      if (current) {
        this.people[person.username] = new Person({ ...current, ...person });
      } else {
        this.people[person.username] = person;
      }
      console.log(`Added ${person.username}`, this.people);
      plugin.storage.setItem('people', this.people);

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
