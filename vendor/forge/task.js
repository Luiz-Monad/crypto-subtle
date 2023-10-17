import 'module';
import './debug.js';
import './log.js';
import './util.js';

var forge = global.forge;
var cat = "forge.task";
var sTasks = {};
var sNextTaskId = 0;
forge.debug.set(cat, "tasks", sTasks);
var sTaskQueues = {};
forge.debug.set(cat, "queues", sTaskQueues);
var sNoTaskName = "?";
var sMaxRecursions = 30;
var sTimeSlice = 20;
var READY = "ready";
var RUNNING = "running";
var BLOCKED = "blocked";
var SLEEPING = "sleeping";
var DONE = "done";
var ERROR = "error";
var STOP = "stop";
var START = "start";
var BLOCK = "block";
var UNBLOCK = "unblock";
var SLEEP = "sleep";
var WAKEUP = "wakeup";
var CANCEL = "cancel";
var FAIL = "fail";
var sStateTable = {};
sStateTable[READY] = {};
sStateTable[READY][STOP] = READY;
sStateTable[READY][START] = RUNNING;
sStateTable[READY][CANCEL] = DONE;
sStateTable[READY][FAIL] = ERROR;
sStateTable[RUNNING] = {};
sStateTable[RUNNING][STOP] = READY;
sStateTable[RUNNING][START] = RUNNING;
sStateTable[RUNNING][BLOCK] = BLOCKED;
sStateTable[RUNNING][UNBLOCK] = RUNNING;
sStateTable[RUNNING][SLEEP] = SLEEPING;
sStateTable[RUNNING][WAKEUP] = RUNNING;
sStateTable[RUNNING][CANCEL] = DONE;
sStateTable[RUNNING][FAIL] = ERROR;
sStateTable[BLOCKED] = {};
sStateTable[BLOCKED][STOP] = BLOCKED;
sStateTable[BLOCKED][START] = BLOCKED;
sStateTable[BLOCKED][BLOCK] = BLOCKED;
sStateTable[BLOCKED][UNBLOCK] = BLOCKED;
sStateTable[BLOCKED][SLEEP] = BLOCKED;
sStateTable[BLOCKED][WAKEUP] = BLOCKED;
sStateTable[BLOCKED][CANCEL] = DONE;
sStateTable[BLOCKED][FAIL] = ERROR;
sStateTable[SLEEPING] = {};
sStateTable[SLEEPING][STOP] = SLEEPING;
sStateTable[SLEEPING][START] = SLEEPING;
sStateTable[SLEEPING][BLOCK] = SLEEPING;
sStateTable[SLEEPING][UNBLOCK] = SLEEPING;
sStateTable[SLEEPING][SLEEP] = SLEEPING;
sStateTable[SLEEPING][WAKEUP] = SLEEPING;
sStateTable[SLEEPING][CANCEL] = DONE;
sStateTable[SLEEPING][FAIL] = ERROR;
sStateTable[DONE] = {};
sStateTable[DONE][STOP] = DONE;
sStateTable[DONE][START] = DONE;
sStateTable[DONE][BLOCK] = DONE;
sStateTable[DONE][UNBLOCK] = DONE;
sStateTable[DONE][SLEEP] = DONE;
sStateTable[DONE][WAKEUP] = DONE;
sStateTable[DONE][CANCEL] = DONE;
sStateTable[DONE][FAIL] = ERROR;
sStateTable[ERROR] = {};
sStateTable[ERROR][STOP] = ERROR;
sStateTable[ERROR][START] = ERROR;
sStateTable[ERROR][BLOCK] = ERROR;
sStateTable[ERROR][UNBLOCK] = ERROR;
sStateTable[ERROR][SLEEP] = ERROR;
sStateTable[ERROR][WAKEUP] = ERROR;
sStateTable[ERROR][CANCEL] = ERROR;
sStateTable[ERROR][FAIL] = ERROR;
var Task = function (options) {
  this.id = -1;
  this.name = options.name || sNoTaskName;
  this.parent = options.parent || null;
  this.run = options.run;
  this.subtasks = [];
  this.error = false;
  this.state = READY;
  this.blocks = 0;
  this.timeoutId = null;
  this.swapTime = null;
  this.userData = null;
  this.id = sNextTaskId++;
  sTasks[this.id] = this;
};
Task.prototype.debug = function (msg) {
  msg = msg || "";
  forge.log.debug(cat, msg, "[%s][%s] task:", this.id, this.name, this, "subtasks:", this.subtasks.length, "queue:", sTaskQueues);
};
Task.prototype.next = function (name, subrun) {
  if (typeof name === "function") {
    subrun = name;
    name = this.name;
  }
  var subtask = new Task({
    run: subrun,
    name: name,
    parent: this
  });
  subtask.state = RUNNING;
  subtask.type = this.type;
  subtask.successCallback = this.successCallback || null;
  subtask.failureCallback = this.failureCallback || null;
  this.subtasks.push(subtask);
  return this;
};
Task.prototype.parallel = function (name, subrun) {
  if (forge.util.isArray(name)) {
    subrun = name;
    name = this.name;
  }
  return this.next(name, function (task) {
    var ptask = task;
    ptask.block(subrun.length);
    var startParallelTask = function (pname, pi) {
      forge.task.start({
        type: pname,
        run: function (task) {
          subrun[pi](task);
        },
        success: function (task) {
          ptask.unblock();
        },
        failure: function (task) {
          ptask.unblock();
        }
      });
    };
    for (var i = 0; i < subrun.length; i++) {
      var pname = name + "__parallel-" + task.id + "-" + i;
      var pi = i;
      startParallelTask(pname, pi);
    }
  });
};
Task.prototype.stop = function () {
  this.state = sStateTable[this.state][STOP];
};
Task.prototype.start = function () {
  this.error = false;
  this.state = sStateTable[this.state][START];
  if (this.state === RUNNING) {
    this.start = new Date();
    this.run(this);
    runNext(this, 0);
  }
};
Task.prototype.block = function (n) {
  n = typeof n === "undefined" ? 1 : n;
  this.blocks += n;
  if (this.blocks > 0) {
    this.state = sStateTable[this.state][BLOCK];
  }
};
Task.prototype.unblock = function (n) {
  n = typeof n === "undefined" ? 1 : n;
  this.blocks -= n;
  if (this.blocks === 0 && this.state !== DONE) {
    this.state = RUNNING;
    runNext(this, 0);
  }
  return this.blocks;
};
Task.prototype.sleep = function (n) {
  n = typeof n === "undefined" ? 0 : n;
  this.state = sStateTable[this.state][SLEEP];
  var self = this;
  this.timeoutId = setTimeout(function () {
    self.timeoutId = null;
    self.state = RUNNING;
    runNext(self, 0);
  }, n);
};
Task.prototype.wait = function (cond) {
  cond.wait(this);
};
Task.prototype.wakeup = function () {
  if (this.state === SLEEPING) {
    cancelTimeout(this.timeoutId);
    this.timeoutId = null;
    this.state = RUNNING;
    runNext(this, 0);
  }
};
Task.prototype.cancel = function () {
  this.state = sStateTable[this.state][CANCEL];
  this.permitsNeeded = 0;
  if (this.timeoutId !== null) {
    cancelTimeout(this.timeoutId);
    this.timeoutId = null;
  }
  this.subtasks = [];
};
Task.prototype.fail = function (next) {
  this.error = true;
  finish(this, true);
  if (next) {
    next.error = this.error;
    next.swapTime = this.swapTime;
    next.userData = this.userData;
    runNext(next, 0);
  } else {
    if (this.parent !== null) {
      var parent = this.parent;
      while (parent.parent !== null) {
        parent.error = this.error;
        parent.swapTime = this.swapTime;
        parent.userData = this.userData;
        parent = parent.parent;
      }
      finish(parent, true);
    }
    if (this.failureCallback) {
      this.failureCallback(this);
    }
  }
};
var start = function (task) {
  task.error = false;
  task.state = sStateTable[task.state][START];
  setTimeout(function () {
    if (task.state === RUNNING) {
      task.swapTime = +new Date();
      task.run(task);
      runNext(task, 0);
    }
  }, 0);
};
var runNext = function (task, recurse) {
  var swap = recurse > sMaxRecursions || +new Date() - task.swapTime > sTimeSlice;
  var doNext = function (recurse) {
    recurse++;
    if (task.state === RUNNING) {
      if (swap) {
        task.swapTime = +new Date();
      }
      if (task.subtasks.length > 0) {
        var subtask = task.subtasks.shift();
        subtask.error = task.error;
        subtask.swapTime = task.swapTime;
        subtask.userData = task.userData;
        subtask.run(subtask);
        if (!subtask.error) {
          runNext(subtask, recurse);
        }
      } else {
        finish(task);
        if (!task.error) {
          if (task.parent !== null) {
            task.parent.error = task.error;
            task.parent.swapTime = task.swapTime;
            task.parent.userData = task.userData;
            runNext(task.parent, recurse);
          }
        }
      }
    }
  };
  if (swap) {
    setTimeout(doNext, 0);
  } else {
    doNext(recurse);
  }
};
var finish = function (task, suppressCallbacks) {
  task.state = DONE;
  delete sTasks[task.id];
  if (task.parent === null) {
    if (!((task.type in sTaskQueues))) {
      forge.log.error(cat, "[%s][%s] task queue missing [%s]", task.id, task.name, task.type);
    } else if (sTaskQueues[task.type].length === 0) {
      forge.log.error(cat, "[%s][%s] task queue empty [%s]", task.id, task.name, task.type);
    } else if (sTaskQueues[task.type][0] !== task) {
      forge.log.error(cat, "[%s][%s] task not first in queue [%s]", task.id, task.name, task.type);
    } else {
      sTaskQueues[task.type].shift();
      if (sTaskQueues[task.type].length === 0) {
        delete sTaskQueues[task.type];
      } else {
        sTaskQueues[task.type][0].start();
      }
    }
    if (!suppressCallbacks) {
      if (task.error && task.failureCallback) {
        task.failureCallback(task);
      } else if (!task.error && task.successCallback) {
        task.successCallback(task);
      }
    }
  }
};
forge.task = forge.task || ({});
forge.task.start = function (options) {
  var task = new Task({
    run: options.run,
    name: options.name || sNoTaskName
  });
  task.type = options.type;
  task.successCallback = options.success || null;
  task.failureCallback = options.failure || null;
  if (!((task.type in sTaskQueues))) {
    sTaskQueues[task.type] = [task];
    start(task);
  } else {
    sTaskQueues[options.type].push(task);
  }
};
forge.task.cancel = function (type) {
  if ((type in sTaskQueues)) {
    sTaskQueues[type] = [sTaskQueues[type][0]];
  }
};
forge.task.createCondition = function () {
  var cond = {
    tasks: {}
  };
  cond.wait = function (task) {
    if (!((task.id in cond.tasks))) {
      task.block();
      cond.tasks[task.id] = task;
    }
  };
  cond.notify = function () {
    var tmp = cond.tasks;
    cond.tasks = {};
    for (var id in tmp) {
      tmp[id].unblock();
    }
  };
  return cond;
};

export { forge as default };
