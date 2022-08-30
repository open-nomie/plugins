/* This is the plugin object. It's a wrapper around the Nomie Plugin API. */
const plugin = new NomiePlugin({
  name: "Meditate",
  addToCaptureMenu: true,
  addToMoreMenu: true,
  emoji: "🧘🏽‍♀️",
  version: "1.0",
  description: "Follow Guided Meditations",
  uses: ['createNote'],
});

let videos = [

  {
    name: '2-Min Focus Meditation',
    duration: '00:05:00',
    description: 'Two minute meditation to start your day',
    note: "#meditation(00:02:00) with @MindfulBreaks",
    youtubeId: '41DEKf4KWdU',
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
  },
  {
    name: '45-Min Guided Meditation',
    duration: '00:45:00',
    description: `Longer sit for beginners`,
    note: "#meditation(00:45:00) advanced meditation with @Oysho",
    youtubeId: 'vQ5ZwjnkJ80',
  },

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
    videos: videos,
    status: '',
    recording: false,
    inNomie: true,
    videoState: "",
    favorites: []
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
    cancelActive() {
      this.activeVideo = undefined;
      this.videoState = "";
      this.completedVideo = undefined;
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
