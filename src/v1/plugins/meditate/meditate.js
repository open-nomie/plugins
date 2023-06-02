/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Meditate",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  emoji: "🧘🏽‍♀️",
  version: "1.1",
  description: "Follow Guided Meditations",
  uses: ['createNote'],
});

let uservideos = []
let videos = [

  {
    name: '2-Min Morning Meditation',
    duration: '00:02:00',
    description: 'Two minute meditation to start your day',
    note: "#meditation(00:02:00) with @MindfulBreaks",
    youtubeId: '41DEKf4KWdU',
  },
  {
    name: '2-Min Calming Meditation',
    duration: '00:02:00',
    description: 'Two minute meditation to start your day',
    note: "#meditation(00:02:00) calming with @TheSchoolOfLife",
    youtubeId: 'Z4rRjGhN-gs',
  },
  {
    name: '5-Min Morning Meditation',
    duration: '00:05:00',
    description: 'uplifting and refreshing combination of breathwork and affirmations.',
    note: "#meditation(00:05:00) morning with @GreatMeditations",
    youtubeId: 'YD5W5eZy90c',
  },
  {
    name: '5-Min Meditation',
    duration: '00:05:00',
    description: 'A quick five minute meditation with @Goodful',
    note: "Quick #meditation(00:05:00) with @Goodful",
    youtubeId: 'inpok4MKVLM',
  },
  {
    name: '10-Min Energy Cleanse Meditation',
    duration: '00:10:00',
    description: `Clear Your System of Any Stress & Anxiety with Great Meditations`,
    note: "#meditation(00:10:00) cleanse meditation with @GreatMeditation",
    youtubeId: 'X4WjbW6amQw',
  },
  {
    name: '10-Min Positive Energy Meditation',
    duration: '00:10:00',
    description: `Guided meditation for positive energy, relaxation, and peace`,
    note: "#meditation(00:10:00) positive energy meditation with @Lavendaire",
    youtubeId: '86m4RC_ADEY',
  },
  {
    name: '10-Min Letting Go Meditation',
    duration: '00:10:00',
    description: `Focus on letting go with this guided meditation by Great Meditations`,
    note: "#meditation(00:10:00) letting go meditation with @GreatMeditation",
    youtubeId: 'KJFB0Re8SMc',
  },
  {
    name: '10-Min Sleep Meditation',
    duration: '00:10:00',
    description: `10 minute meditation that's good before you go to bed.`,
    note: "#meditation(00:10:00) sleep meditation with @Goodful",
    youtubeId: 'aEqlQvczMJQ',
  },
  {
    name: '15-Min Self Love Meditation',
    duration: '00:15:00',
    description: `Close your eyes and release all the negative thoughts that you have been holding on to. It's time from some self-love`,
    note: "#meditation(00:15:00) self love meditation with @Goodful",
    youtubeId: 'itZMM5gCboo',
  },
  {
    name: '30-Min Vipassana Advanced Sit',
    duration: '00:30:00',
    description: `Less guidance. More silence. Just the important bits. `,
    note: "#meditation(00:30:00) advanced meditation with @AreYouZen",
    youtubeId: '8g2iNQIcbLY',
  }

]

/**
 * Vue 2.0 App
 */
new Vue({
  data: () => ({
    error: undefined,
    mode: 'hidden',
    loading: true,
    activeVideo: undefined,
    completedVideo: undefined,
    addMeditation: undefined,
    videos: videos,
    uservideos: uservideos,
    status: '',
    recording: false,
    inNomie: true,
    videoState: "",
    favorites: [],
    trackable: undefined,
    new_name: '',
    new_duration: '',
    new_description: '',
    new_note: '',
    new_youtubeid: '',
  }),
  computed: {

  },
  async mounted() {
    /**
     * on UI Opened
     * Gets fired when the user opens the plugin modal
     */
    plugin.onUIOpened(async () => {
      this.mode = 'modal';
    });

    plugin.onRegistered(async () => {
      this.inNomie = true;
      this.loading = false;
      await plugin.storage.init()
      this.favorites = plugin.storage.getItem('favorites') || [];
      this.uservideos = plugin.storage.getItem('uservideos') || []
      this.trackable = await plugin.getTrackable('#meditation');
      this.videos = this.uservideos.concat(videos);
      

    })

    setTimeout(() => {
      if (this.loading) {
        this.inNomie = false;
      }
    }, 700);

  },
  computed: {
    insideNomie() {
      return this.inNomie
    }
  },
  methods: {
    toggleFavorite(videoId, evt) {
      if (evt) {
        evt.preventDefault();
        evt.stopPropagation();
      }

      if (this.favorites.includes(videoId)) {
        this.favorites = this.favorites.filter(f => {
          return f !== videoId
        })
      } else {
        this.favorites.push(videoId);
      }
      plugin.storage.setItem('favorites', this.favorites);
    },
    installTrackable() {
      const trackable = {
        type: 'tracker',
        tag: '#meditation',
        tracker: {
          id: 'meditation',
          type: 'timer',
          label: 'Meditation',
          emoji: '🧘🏽‍♀️'
        }
      }
      plugin.openTrackableEditor(trackable);
    },
    cancelActive() {
      this.activeVideo = undefined;
      this.videoState = "";
      this.completedVideo = undefined;
    },
    async deleteActive(videoId, evt) {
      var confirm = await plugin.confirm('Delete this video?', 'Do you really want to delete this video?');
      if (confirm.value){
      let newlist = this.uservideos.filter( el => el.youtubeId !== videoId ); 
      this.uservideos = newlist;
      plugin.storage.setItem("uservideos",this.uservideos);
      this.videos = this.uservideos.concat(videos);
      this.activeVideo = undefined;
      this.videoState = "";
      this.completedVideo = undefined;
    }},
    addRecord() {
      this.addMeditation = true;
      this.new_note = "#meditation(00:10:00)"
    },
    cancelAddRecord() {
      this.addMeditation = false;
    },
    saveAddRecord() {
      //validate input
      var feedback = "";
      if (this.new_name =="") {feedback = "-Name missing"}
      if (this.new_youtubeid =="") {feedback = feedback + "\n-Youtube Id is missing"}
      if (this.new_note =="") {feedback = feedback + "\n-Nomie Note is missing"}
      var isValid = /^([0-1]?[0-9]|2[0-4]):([0-5][0-9])(:[0-5][0-9])?$/.test(this.new_duration);
      if (!isValid) {feedback = feedback + "\n-Duration is not in correct format"}
      if (feedback !="") {
        plugin.alert('Input Not Valid', feedback);
      }
      else {
      this.uservideos.push(
        {
          name: this.new_name,
          duration: this.new_duration,
          description: this.new_description,
          note: this.new_note,
          youtubeId: this.new_youtubeid,
          userDefined: true,
        }
      )
      plugin.storage.setItem("uservideos",this.uservideos)
      this.videos = this.uservideos.concat(videos);
      this.addMeditation = false;
    }
    },
    clear(prompt) {
      let proceed = prompt ? confirm('Clear completed video?') : true;
      if (proceed) {
        this.completedVideo = undefined;
      }
    },
    async recordCompleted() {
      this.recording = true;
      if (this.inNomie && this.completedVideo) {
        const note = this.completedVideo.note;
        plugin.createNote({
          note: `${note} +yt_${this.completedVideo.youtubeId} +care`,
          score: 3
        });
      };
      const videoId = this.completedVideo.youtubeId;
      const updatedVideos = this.videos.map((vid) => {
        if (vid.youtubeId == videoId) {
          vid.watched = true;
          console.log("Adding Watched!!", vid);
        }
        return vid;
      })
      this.videos = updatedVideos;
      setTimeout(() => {
        this.clear();
        this.recording = false;
      }, 1000)

    },
    markAsWatched() {
      this.videoState = "";
      // The video is complete
      this.completedVideo = { ...this.activeVideo };
      this.activeVideo = undefined;
    },
    selectVideo(video) {
      this.clear();
      this.activeVideo = video;
      setTimeout(() => {
        new YT.Player('frame-holder', {
          height: `${window.document.body.scrollHeight - 200}px`,
          width: '100%',
          autoPlay: true,
          videoId: video.youtubeId,
          playerVars: {
            'playsinline': 1
          },
          events: {
            'onReady': (evt) => {
              console.log("Video Ready to Play", evt)
            },
            'onStateChange': (evt) => {
              if (evt.data == 1) {
                this.videoState = "playing";
              } else if (evt.data == 2) {
                this.videoState = "paused";
              } else if (evt.data == 0) {
                this.markAsWatched()
              }
            }
          }
        });


      }, 300);

    }
  },

}).$mount("#content");
