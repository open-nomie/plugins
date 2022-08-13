// const NOMIEPROMPTS = {};
export type PluginUseTypes =
  | "trackablesSelected"
  | "selectTrackables"
  | "onUIOpened"
  | "registered"
  | "onLaunch"
  | "openURL"
  | "openPlugin"
  | "searchNotes"
  | "searchReply"
  | "confirmReply"
  | "promptReply"
  | "onNote"
  | "createNote";

export type PluginType = {
  id: string;
  name: string;
  description?: string;
  emoji?: string;
  addToCaptureMenu: boolean;
  addToMoreMenu: boolean;
  url: string;
  version: string;
  active: boolean;
  uses: Array<PluginUseTypes>;
  error?: string;
};

type getTrackableUsageProps = {
  tag: string;
  date?: Date;
  daysBack?: number;
  groupByDay?: boolean;
};

type UserPrefs = {
  use24Hour?: boolean;
  useMetric?: boolean;
  useLocation?: boolean;
  weekStarts: "monday" | "sunday";
  theme: "dark" | "light" | "system";
};

export class NomiePlugin {
  pluginDetails: PluginType;
  registered: boolean;
  pid: undefined | string;
  listeners: any;
  ready: boolean;
  storage: any;
  prefs?: UserPrefs;

  constructor(starter: PluginType) {
    this.pluginDetails = { ...starter };
    this.registered = false;
    this.pid = undefined;
    this.listeners = {};
    this.ready = false;
    this.storage = new NomieStorage(this, "prefs");

    const fireReady = async () => {
      if (!this.ready) {
        window.addEventListener(
          "message",
          (evt) => {
            this.onMessage(evt);
          },
          false
        );
        this.ready = true;
        this.pid = this.getPid();
      }
      await this.storage.init();
    };

    fireReady();
    this.register();
  }

  // _writeStorage() {
  //   localStorage.setItem('npl-storage', JSON.stringify(this.storage));
  // }

  // getItem(key: string) {
  //   return this.storage[key];
  // }

  // setItem(key: string, value: string) {
  //   this.storage[key] = value;
  //   this._writeStorage();
  // }

  searchNotes(term: string, date = new Date(), daysBack = 7) {
    return new Promise((resolve) => {
      let id = this.toId("search");
      this.broadcast("searchNotes", {
        term,
        date,
        daysBack,
        id,
      });
      this.listeners[id] = (payload: any) => {
        resolve(payload.results);
      };
    });
  }

  selectTrackables(type: any, multiple = true) {
    return new Promise((resolve) => {
      let id = this.toId("select");
      this.broadcast("selectTrackables", { id, type, multiple });
      this.listeners[id] = (payload: any) => {
        resolve(payload.selected);
      };
    });
  }

  get is24Hour() {
    return this.prefs?.use24Hour;
  }
  get isMetric() {
    return this.prefs?.useMetric;
  }

  createNote(log: any) {
    setTimeout(() => {
      if (typeof log === "string") {
        this.broadcast("createNote", { note: log });
      } else {
        this.broadcast("createNote", log);
      }
    }, 300);
  }

  _fireListeners(key: string, payload: any) {
    (this.listeners[key] || []).forEach((func: Function) => {
      func(payload);
    });
  }

  onMessage(event: any) {
    const action = event.data.action;
    const payload = event.data.data;
    switch (action) {
      case "registered":
        this.registered = true;
        this.pid = payload.id;
        this.prefs = { ...payload.user };
        this._fireListeners("onRegistered", this);
        break;
      case "onUIOpened":
        console.log("onUIOpened Called!");
        this._fireListeners("onUIOpened", this);
        break;
      case "onNote":
        this._fireListeners("onNote", payload);
        break;
      case "onLaunch":
        this.registered = true;
        setTimeout(() => {
          this._fireListeners("onLaunch", payload);
        }, 300);
        break;
      case "promptReply":
        this.listenerResponse(payload);
        break;
      case "getTrackableReply":
          this.listenerResponse(payload);
          break;
      case "getTrackableUsageReply":
        console.log("⛔️⛔️⛔️⛔️⛔️⛔️ Trackable Usage Reply", payload);
        this.listenerResponse(payload);
        break;
      case "searchReply":
        this.listenerResponse(payload);
        break;
      case "locationReply":
        this.listenerResponse(payload);
        break;
      case "trackablesSelected":
        this.listenerResponse(payload);
        break;
      case "confirmReply":
        this.listenerResponse(payload);
        break;
      case "setStorageItemReply":
        this.listenerResponse(payload);
        break;
      case "getStorageItemReply":
        this.listenerResponse(payload);
        break;
    }
  }

  /**
   * It takes a string and returns a string
   * @param {string} type - The type of the element.
   * @returns A string that is a combination of the type and a random number.
   */
  private toId(type: string): string {
    return `${type.replace(/[^a-z0-9]/gi, '')}-${Math.random().toString(16)}`;
  }

  /**
   * It adds a listener to the `listeners` object, which is a property of the `WebSocketService` class
   * @param {string} id - The id of the request.
   * @param {any} resolver - The function that will be called when the response is received.
   */
  private addResponseListener(id: string, resolver: any) {
    this.listeners[id] = (pload: any) => {
      resolver(pload);
    };
  }

  /**
   * It returns a promise that resolves to the location data when the location data is available
   * @returns A promise that resolves to the location data.
   */
  getLocation(): Promise<any> {
    return new Promise((resolve, reject) => {
      let id = this.toId("location");
      this.broadcast("getLocation", { id });
      this.addResponseListener(id, resolve);
    });
  }

  getTrackable(tag:string) {
    return new Promise((resolve) => {
      let id = this.toId(`trackable-${tag}`);
      const payload = {
        id,
        tag
      };
      this.broadcast("getTrackable", payload);
      this.addResponseListener(id, resolve);
    });
  }

  getTrackableInput(tag:string) {
    return new Promise((resolve) => {
      let id = this.toId(`trackable-value-${tag}`);
      this.broadcast("getTrackableInput", {
        id,
        tag
      });
      this.addResponseListener(id, resolve);
    });
  }

  getTrackableUsage(props: getTrackableUsageProps) {
    return new Promise((resolve) => {
      let id = this.toId(`usage-${props.tag}`);
      const payload = {
        id,
        tag: props.tag,
        date: props.date || new Date(),
        daysBack: props.daysBack,
        groupByDay: props.groupByDay,
      };
      this.broadcast("getTrackableUsage", payload);
      this.addResponseListener(id, resolve);
    });
  }

  /**
   * The function returns a promise that resolves to the value of the input field
   * @param {string} title - The title of the prompt
   * @param {string} [message] - The message to display in the prompt.
   * @param {string} [type] - string - The type of prompt. This can be 'confirm' or 'prompt'.
   * @returns A promise.
   */
  prompt(title: string, message?: string, type?: string) {
    return new Promise((resolve, reject) => {
      let id = this.toId("prompt");
      this.broadcast("prompt", {
        title,
        message,
        type,
        id,
      });
      // this.addResponseListener(id, resolve)
      this.addResponseListener(id, resolve);
    });
  }

  /**
   * The function returns a promise that resolves when the user clicks the confirm button
   * @param {string} title - The title of the modal
   * @param {string} [message] - The message to be displayed in the dialog.
   * @returns A promise.
   */
  confirm(title: string, message?: string) {
    return new Promise((resolve, reject) => {
      let id = this.toId("confirm");
      this.broadcast("confirm", {
        title,
        message,
      });
      this.addResponseListener(id, resolve);
    });
  }

  /**
   * If the listener exists, resolve the promise with the payload, and delete the listener
   * @param {any} payload - any
   */
  listenerResponse(payload: any) {
    if (this.listeners && this.listeners[payload.id]) {
      const resolve = this.listeners[payload.id];
      if (resolve) {
        resolve(payload);
        delete this.listeners[payload.id];
      } else {
        console.error(`No resolve found for prompts[${payload.id}]`);
      }
    }
  }

  /**
   * It broadcasts a message to the main process, and then waits for a response
   * @param {string} key - The key to get the value of
   * @returns A promise that resolves to the value of the key in the storage.
   */
  getStorageItem(key: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let id = this.toId(`storage-get-${key}`);
      this.broadcast("getStorageItem", {
        key,
        id,
      });
      this.addResponseListener(id, resolve);
    });
  }

  /**
   * It broadcasts a message to the main process, and then waits for a response from the main process
   * @param {string} key - The key to store the value under
   * @param {any} value - any - The value to set the storage item to.
   * @returns A promise that resolves to the value of the key in storage.
   */
  setStorageItem(key: string, value: any) {
    return new Promise((resolve, reject) => {
      let id = this.toId(`storage-set-${key}`);
      this.broadcast("setStorageItem", {
        key,
        value,
        id,
      });
      this.addResponseListener(id, resolve);
    });
  }

  /**
   * It takes an action and a payload, and sends a message to the parent window with the action and
   * payload
   * @param {string} action - The action to be performed.
   * @param {any} payload - any - This is the data that you want to send to the parent window.
   */
  broadcast(action: string, payload: any) {
    const pid = this.getPid();
    if (window.parent) {
      window.parent.postMessage(
        { action, data: { ...payload, ...{ pid } } },
        "*"
      );
    }
  }

  /**
   * It returns the value of the pid query parameter in the URL, or undefined if it doesn't exist
   * @returns The pid of the current page.
   */
  getPid(): string | undefined {
    return new URL(window.location.href).searchParams.get("pid") || undefined;
  }

  /**
   * It adds a listener to the event 'onUIOpened'
   * @param {Function} func - Function - The function to be called when the event is triggered.
   */
  onUIOpened(func: Function): void {
    this.on("onUIOpened", func);
  }

  /**
   * The function takes a function as an argument and calls the on function with the event name and the
   * function as arguments
   * @param {Function} func - Function - The function to be called when the event is triggered.
   */
  onNote(func: Function): void {
    this.on("onNote", func);
  }

  /**
   * The function takes a function as an argument and calls the on function with the event name
   * onLaunch and the function as the argument
   * @param {Function} func - Function
   */
  onLaunch(func: Function): void {
    this.on("onLaunch", func);
  }

  /**
   * The function takes a function as an argument and calls the on function with the event name and the
   * function as arguments
   * @param {Function} func - Function - The function to be called when the event is triggered.
   */
  onRegistered(func: Function): void {
    this.on("onRegistered", func);
  }

  /**
   * It takes an event name and a function as arguments, and adds the function to the array of
   * listeners for that event name
   * @param {string} eventName - The name of the event you want to listen for.
   * @param {Function} func - The function to be called when the event is triggered.
   */
  on(eventName: string, func: Function) {
    this.listeners[eventName] = this.listeners[eventName] || [];
    if (!this.listeners[eventName].includes(func)) {
      this.listeners[eventName].push(func);
    }
  }

  /**
   * If the plugin hasn't been registered, then broadcast the plugin details to the parent window
   */
  register() {
    if (!this.registered) {
      let pluginDetails = { ...this.pluginDetails };
      this.broadcast("register", pluginDetails);
      this.registered = true;
    }
  }
}

export class NomieStorage {
  plugin: NomiePlugin;
  data: any = {};
  filename: string;
  constructor(plugin: NomiePlugin, filename: string = "prefs") {
    this.plugin = plugin;
    this.filename = filename;
    this.data = {};
  }
  async init(): Promise<NomieStorage> {
    const raw = await this.plugin.getStorageItem(this.filename);
    if (raw && raw.value) this.data = raw.value;
    return this;
  }
  getItem(key: string): any {
    return this.data[key];
  }
  async setItem(key: string, value: any) {
    console.log(`✅ setting ${key}`, value);
    this.data[key] = value;
    return await this.save();
  }
  private async save() {
    return this.plugin.setStorageItem(this.filename, this.data);
  }
}
