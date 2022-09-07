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
      let maxDiff = this.maxNoContactDays - daysDiff;
      return maxDiff;
    } else {
      return 1000;
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