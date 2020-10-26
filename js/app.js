
// GLOBAL STATE

var startHash = '#start-screen';
var curScreen;

var keyBtnsData = [{
  id: "btn-r1",
  screen: "right-hand",
  event_code: "Digit1"
},{
  id: "btn-r2",
  screen: "right-hand",
  event_code: "Digit2"
},{
  id: "btn-r3",
  screen: "right-hand",
  event_code: "Digit3"
},{
  id: "btn-r4",
  screen: "right-hand",
  event_code: "KeyQ"
},{
  id: "btn-r5",
  screen: "right-hand",
  event_code: "KeyW"
},{
  id: "btn-r6",
  screen: "right-hand",
  event_code: "KeyE"
},{
  id: "btn-l1",
  screen: "left-hand",
  event_code: "Digit1"
},{
  id: "btn-l2",
  screen: "left-hand",
  event_code: "Digit2"
},{
  id: "btn-l3",
  screen: "left-hand",
  event_code: "Digit3"
},{
  id: "btn-l4",
  screen: "left-hand",
  event_code: "KeyQ"
},{
  id: "btn-l5",
  screen: "left-hand",
  event_code: "KeyW"
},{
  id: "btn-l6",
  screen: "left-hand",
  event_code: "KeyE"
}];

var countdownInitVal = 5;
var countdownInt;

var curKeyBtns;
var curSwitcherInt;

var timePerMoveMs = 5000;
var soundDuration = 50;

// THIRD-PARTY

var audioCtx;
if (window.AudioContext) {
  audioCtx = new window.AudioContext();
} else if (window.webkitAudioContext) {
  audioCtx = new window.webkitAudioContext();
}

function beep () {
  var oscillator = audioCtx.createOscillator();
  var gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  gainNode.gain.value = 0.1;
  oscillator.frequency.value = 520;
  oscillator.type = "square";

  oscillator.start();

  setTimeout(function () {
    oscillator.stop();
  }, soundDuration);
};

// HELPERS

var isRoundStarted = function () {
  return curSwitcherInt != null;
};

var getKeyBtn = function (keyBtnId) {
  return document.getElementById(keyBtnId);
};

var isCurrent = function (keyBtnEl) {
  return keyBtnEl.classList.contains("current");
};

var makeCurrent = function (keyBtnEl) {
  document.querySelectorAll(".key-btn").forEach(function (node) {
    node.classList.remove("current");
  });
  if (keyBtnEl) {
    keyBtnEl.classList.add("current");
  }
};

var hideUp = function (id) {
  document.getElementById(id).classList.add("hidden");
};

var showUp = function (id) {
  document.getElementById(id).classList.remove("hidden");
};

var createCounter = function (parentEl, initVal) {
  var counterEl = document.createElement("div");
  counterEl.id = "counter";
  counterEl.dataset.count = initVal;
  parentEl.appendChild(counterEl);
  return counterEl;
};

var getNewCount = function (counterEl) {
  return parseInt(counterEl.dataset.count) - 1;
};

var setCounterCount = function (counterEl, newCount) {
  counterEl.dataset.count = newCount;
  if (newCount === 0) {
    counterEl.remove();
  }
};

var makeSound = function () {
  document.getElementById("beep-btn").click();
};

// BUSINESS LOGIC

var incHitCount = function (keyBtnEl) {
  if (!isCurrent(keyBtnEl)) {
    return;
  }
  
  var hits = parseInt(keyBtnEl.dataset.hits) || 0;
  keyBtnEl.dataset.hits = hits + 1;
};

var updCounter = function (counterEl) {
  var newCount = getNewCount(counterEl);
  
  if (newCount === 0) {
    clearInterval(countdownInt);
    countdownInt = null;
  }
  
  setCounterCount(counterEl, newCount);
};

var makeNextMove = function () {
  if (!curKeyBtns.length) {
    clearInterval(curSwitcherInt);
    curSwitcherInt = null;
  }
  
  var curKeyBtn = getKeyBtn(curKeyBtns[0]);
  makeCurrent(curKeyBtn);
  
  curKeyBtns = curKeyBtns.slice(1);
  
  if (curKeyBtn) {
    makeSound();
  }
};

var runRoundActivities = function (handPaneSelector, showUpElId) {
  hideUp(showUpElId);
  
  var handPaneEl = document.querySelector(handPaneSelector);
  var counterEl = createCounter(handPaneEl, countdownInitVal);
  var countdownTimeMs = timePerMoveMs / countdownInitVal;
  countdownInt = setInterval(updCounter, countdownTimeMs, counterEl);
  
  curSwitcherInt = setInterval(makeNextMove, timePerMoveMs);
  
  var totalRoundTimeMs = (curKeyBtns.length + 1)*timePerMoveMs;
  setTimeout(showUp, totalRoundTimeMs, showUpElId);
};

var startTestRound = function (roundName) {
  switch (roundName) {
    case "right-hand-screen":
      curKeyBtns = [
        "btn-r1", "btn-r2", "btn-r3",
        "btn-r6", "btn-r5", "btn-r4"
      ];
      runRoundActivities("#right-hand-screen > .hand-pane", "resume-block");
      break;
    case "left-hand-screen":
      curKeyBtns = [
        "btn-l1", "btn-l2", "btn-l3",
        "btn-l6", "btn-l5", "btn-l4"
      ];
      runRoundActivities("#left-hand-screen > .hand-pane", "results-block");
      break;
  }
};

var countResults = function (res_key_btns, rhp_key_btns, lhp_key_btns) {
  // NB: Pre-supposing that 'res_key_btns', 'rhp_key_btns' and 'lhp_key_btns' all have the same length.
  for (var i = 0; i < res_key_btns.length; i++) {
    var rh_val = parseInt(rhp_key_btns[i].dataset.hits) || 0;
    var lh_val = parseInt(lhp_key_btns[i].dataset.hits) || 0;
    var avg = 0.5*(rh_val + lh_val);
    res_key_btns[i].innerText = avg;
  }
};

// EVENT LISTENERS

document.querySelectorAll(".key-btn").forEach(function (node) {
  node.onclick = function (event) {
    incHitCount(node);
  };
  node.classList.add("noselect");
});

window.addEventListener("keydown", function (event) {
  if (event.defaultPrevented) {
    return;
  }

  var keyBtnData = keyBtnsData.filter(function (kbd) {
    return kbd.screen === curScreen && kbd.event_code === event.code;
  });

  if (keyBtnData.length) {
    incHitCount(getKeyBtn(keyBtnData[0].id));
  }

  event.preventDefault();
}, true);

document.querySelectorAll(".action-link").forEach(function (node) {
  node.onclick = function (event) {
    var startRound = function (href) {
      if (!isRoundStarted()) {
        var hash = href.split('#')[1];
        startTestRound(hash);
      }
    };
    
    if (node.tagName === 'BUTTON') {
      beep();
      if (location.hash === startHash) {
        location.hash = node.dataset.href;
        startRound(node.dataset.href);
      }
    } else {
      startRound(node.href);
    }
  };
});

window.onload = function () {
  location.hash = startHash;
}; 

window.onhashchange = function () {
  curScreen = location.hash.substr(1, location.hash.length - 8);
  
  if (location.hash === '#results-screen') {
    var res_key_btns = document.querySelectorAll("#results-screen > .hand-pane > .key-btn");
    var rhp_key_btns = document.querySelectorAll("#right-hand-screen > .hand-pane > .key-btn");
    var lhp_key_btns = document.querySelectorAll("#left-hand-screen > .hand-pane > .key-btn");
    
    countResults(res_key_btns, rhp_key_btns, lhp_key_btns);
  }
};
