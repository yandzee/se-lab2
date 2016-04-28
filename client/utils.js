'use strict';

class EventEmitter {
  constructor() {
    this.events = Object.create(null);
  }

  on(event, handler) {
    if (!this.events[event])
      this.events[event] = [handler];
    else
      this.events[event].push(handler);
  }

  emit(event, ...data) {
    if (!(event in this.events))
      return;

    for (let handler of this.events[event])
      handler(...data);
  }
}
