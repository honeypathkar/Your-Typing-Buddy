// script.js
document.addEventListener("DOMContentLoaded", () => {
  const paragraphsPool = [
    // Renamed to paragraphsPool and added longer texts
    // Existing paragraphs
    "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. Sphinx of black quartz, judge my vow. The five boxing wizards jump quickly.",
    "JavaScript is a versatile language used for web development. It allows for dynamic content and interactive user experiences. Learning JavaScript can open many doors in the tech industry.",
    "The journey of a thousand miles begins with a single step. Perseverance and dedication are key to achieving long-term goals. Never underestimate the power of consistent effort.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune, or to take arms against a sea of troubles and by opposing end them.",
    "In the world of programming, bugs are inevitable. Debugging is the process of finding and fixing these errors. It requires patience, logic, and sometimes a bit of luck. Test your code frequently.",
    // Added longer paragraphs
    "The intricate tapestry of the cosmos unfolds across an unimaginable expanse, where swirling nebulae birth new stars and ancient galaxies drift in silent majesty. Each pinpoint of light in the night sky represents a sun, perhaps with its own retinue of planets, some of which might harbor conditions conducive to life. Exploring these celestial wonders, even from afar, ignites our curiosity and pushes the boundaries of human knowledge, reminding us of our small yet significant place in the universe's grand design.",
    "Technology continues to reshape our world at an astonishing pace, weaving itself into the fabric of daily life. From artificial intelligence that powers smart assistants to the blockchain revolutionizing secure transactions, innovation drives progress. However, with these advancements come complex ethical considerations and the need for responsible development. Navigating this evolving landscape requires adaptability, critical thinking, and a commitment to harnessing technology for the betterment of all humankind, ensuring that progress serves humanity's deepest values.",
    "Literature offers a profound gateway into the human experience, allowing us to traverse time, cultures, and perspectives. Through the carefully chosen words of authors, we can explore the depths of joy, sorrow, love, and conflict. Whether it's a classic novel, a contemporary poem, or a thought-provoking essay, reading enriches our understanding of ourselves and the world around us. It fosters empathy, stimulates imagination, and provides solace, making it an indispensable companion on life's journey.",
    "Environmental conservation is no longer a niche concern but a global imperative. The delicate balance of our planet's ecosystems is under threat from climate change, pollution, and habitat destruction. Urgent action is needed at all levels, from individual lifestyle changes to international policy agreements. Protecting biodiversity, transitioning to renewable energy, and promoting sustainable practices are crucial steps towards safeguarding Earth for future generations. Every effort, no matter how small it may seem, contributes to a healthier and more resilient world.",
    "The pursuit of knowledge is a lifelong endeavor that fuels personal growth and societal advancement. Education, in its many forms, empowers individuals to think critically, solve problems, and contribute meaningfully to their communities. It is not merely about acquiring facts but about developing the capacity to learn, adapt, and innovate. By fostering a culture of curiosity and continuous learning, we can unlock human potential and address the complex challenges facing our interconnected world, building a brighter future for everyone.",
  ];

  const textDisplay = document.getElementById("text-display");
  const wpmDisplay = document.getElementById("wpm-display");
  const accuracyDisplay = document.getElementById("accuracy-display");
  const timerDisplay = document.getElementById("timer-display");
  const highestWpmDisplay = document.getElementById("highest-wpm-display"); // Added
  const durationSelect = document.getElementById("duration-select");
  const caseSelect = document.getElementById("case-select"); // Added
  const startResetButton = document.getElementById("start-reset-button");
  const messageBox = document.getElementById("message-box");
  const hiddenInput = document.getElementById("hidden-input");

  let currentParagraph = "";
  let paragraphSpans = [];
  let currentIndex = 0;
  let timeLeft = 0;
  let initialDuration = 0;
  let currentCaseType = "mixed"; // Added
  let timerInterval = null;
  let testActive = false;
  let typedCharsCount = 0;
  let correctCharsCount = 0;
  // let incorrectCharsCount = 0; // This wasn't strictly necessary for WPM/Accuracy as calculated
  let startTime = null;

  let correctKeySynth, incorrectKeySynth;

  function initializeAudio() {
    if (!correctKeySynth) {
      correctKeySynth = new Tone.Synth({
        oscillator: { type: "sine" },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.05, release: 0.1 },
        volume: -18,
      }).toDestination();
    }
    if (!incorrectKeySynth) {
      incorrectKeySynth = new Tone.Synth({
        oscillator: { type: "square" },
        envelope: { attack: 0.01, decay: 0.2, sustain: 0.01, release: 0.1 },
        volume: -15,
      }).toDestination();
    }
  }

  function playCorrectSound() {
    if (correctKeySynth && Tone.context.state === "running") {
      correctKeySynth.triggerAttackRelease("C5", "8n");
    }
  }

  function playIncorrectSound() {
    if (incorrectKeySynth && Tone.context.state === "running") {
      incorrectKeySynth.triggerAttackRelease("C3", "8n");
    }
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
  }

  function showMessage(text, type = "info", duration = 3000) {
    messageBox.textContent = text;
    messageBox.className = "message-box";
    messageBox.classList.add(type);
    void messageBox.offsetWidth;
    messageBox.classList.remove("hidden");
    setTimeout(() => {
      messageBox.classList.add("hidden");
    }, duration);
  }

  // --- High Score Functions ---
  function getHighScoreKey(duration, caseType) {
    return `typingTestHighScore_${duration}_${caseType}`;
  }

  function loadHighScore() {
    const key = getHighScoreKey(initialDuration, currentCaseType);
    const highScore = localStorage.getItem(key) || 0;
    highestWpmDisplay.textContent = `Best: ${highScore} WPM`;
  }

  function saveHighScore(wpm) {
    const key = getHighScoreKey(initialDuration, currentCaseType);
    const currentHighScore = parseInt(localStorage.getItem(key) || 0);
    if (wpm > currentHighScore) {
      localStorage.setItem(key, wpm);
      highestWpmDisplay.textContent = `Best: ${wpm} WPM`;
      showMessage(
        `New high score for this setting: ${wpm} WPM!`,
        "success",
        4000
      );
    }
  }
  // --- End High Score Functions ---

  function loadNewParagraph() {
    const randomIndex = Math.floor(Math.random() * paragraphsPool.length); // Use paragraphsPool
    let rawParagraph = paragraphsPool[randomIndex];

    currentCaseType = caseSelect.value; // Get current case type
    if (currentCaseType === "lowercase") {
      currentParagraph = rawParagraph.toLowerCase();
    } else if (currentCaseType === "uppercase") {
      currentParagraph = rawParagraph.toUpperCase();
    } else {
      // mixed
      currentParagraph = rawParagraph;
    }

    textDisplay.innerHTML = "";
    paragraphSpans = [];
    currentParagraph.split("").forEach((char) => {
      const span = document.createElement("span");
      span.textContent = char;
      textDisplay.appendChild(span);
      paragraphSpans.push(span);
    });

    if (paragraphSpans.length > 0) {
      paragraphSpans[0].classList.add("current");
    }
    loadHighScore(); // Load high score for the new settings
  }

  function updateStats() {
    const currentTime = new Date();
    const timeElapsedSeconds = startTime ? (currentTime - startTime) / 1000 : 0;
    const timeElapsedMinutes = timeElapsedSeconds / 60;

    let wpm = 0;
    if (timeElapsedMinutes > 0 && correctCharsCount > 0) {
      // Check correctCharsCount too
      wpm = Math.round(correctCharsCount / 5 / timeElapsedMinutes);
    }
    wpmDisplay.textContent = `WPM: ${wpm}`;

    let accuracy = 100;
    if (typedCharsCount > 0) {
      accuracy = Math.round((correctCharsCount / typedCharsCount) * 100);
    }
    accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;
    return wpm; // Return WPM for potential use in endTest
  }

  function handleKeyPress(event) {
    if (!testActive) return; // Test must be active

    const typedChar = event.key;
    let expectedChar = "";
    if (currentIndex < currentParagraph.length) {
      expectedChar = currentParagraph[currentIndex];
    }

    // Prevent default for keys that might scroll or have other browser actions
    if (
      typedChar === " " ||
      (typedChar.length === 1 && typedChar.match(/[a-zA-Z0-9.,';:"?!-]/))
    ) {
      event.preventDefault();
    } else if (typedChar === "Backspace") {
      event.preventDefault();
    } else {
      return; // Ignore other keys like Shift, Ctrl, Alt, Tab, etc.
    }

    if (typedChar.length === 1 && currentIndex < currentParagraph.length) {
      typedCharsCount++;
      paragraphSpans[currentIndex].classList.remove("current");

      if (typedChar === expectedChar) {
        // Comparison is case-sensitive based on displayed paragraph
        paragraphSpans[currentIndex].classList.add("correct");
        correctCharsCount++;
        playCorrectSound();
      } else {
        paragraphSpans[currentIndex].classList.add("incorrect");
        // incorrectCharsCount++; // Not strictly needed for WPM/Accuracy as calculated
        playIncorrectSound();
      }
      currentIndex++;
      if (currentIndex < currentParagraph.length) {
        paragraphSpans[currentIndex].classList.add("current");
      } else {
        if (correctCharsCount === currentParagraph.length) {
          // Paragraph completed
          endTest(true);
        }
      }
    } else if (typedChar === "Backspace" && currentIndex > 0) {
      currentIndex--;
      paragraphSpans[currentIndex].classList.remove("correct", "incorrect");
      // Visual correction, stats are generally forward-looking
      // For a more complex stat adjustment on backspace, logic would go here.

      if (currentIndex < currentParagraph.length) {
        paragraphSpans[currentIndex].classList.add("current");
      }
      if (
        currentIndex + 1 < paragraphSpans.length &&
        paragraphSpans[currentIndex + 1]
      ) {
        paragraphSpans[currentIndex + 1].classList.remove("current");
      }
    }
    updateStats();
  }

  function startTimer() {
    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
      updateStats();

      if (timeLeft <= 0) {
        endTest(false);
      }
    }, 1000);
  }

  function resetTestState() {
    clearInterval(timerInterval);
    testActive = false;
    currentIndex = 0;
    typedCharsCount = 0;
    correctCharsCount = 0;
    startTime = null;

    initialDuration = parseInt(durationSelect.value);
    currentCaseType = caseSelect.value; // Update case type
    timeLeft = initialDuration;

    timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
    wpmDisplay.textContent = `WPM: 0`;
    accuracyDisplay.textContent = `Accuracy: 100%`;

    loadNewParagraph(); // This will also call loadHighScore

    startResetButton.textContent = "Start";
    durationSelect.disabled = false;
    caseSelect.disabled = false; // Enable case select
    document.removeEventListener("keydown", handleKeyPress);
    messageBox.classList.add("hidden");
  }

  function startTest() {
    if (Tone.context.state !== "running") {
      Tone.start()
        .then(() => {
          initializeAudio();
        })
        .catch((e) => {
          console.error("Tone.start() failed:", e);
          showMessage(
            "Could not enable audio. Please click again or refresh.",
            "error"
          );
          return;
        });
    } else {
      initializeAudio();
    }

    resetTestState();
    testActive = true;
    startTime = new Date();

    startResetButton.textContent = "Reset";
    durationSelect.disabled = true;
    caseSelect.disabled = true; // Disable case select during test

    startTimer();
    document.addEventListener("keydown", handleKeyPress);

    if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
      hiddenInput.focus();
      setTimeout(() => hiddenInput.blur(), 100);
    }
    // textDisplay.focus(); // Not strictly needed as keydown is on document
  }

  function endTest(paragraphCompleted) {
    clearInterval(timerInterval);
    testActive = false;
    document.removeEventListener("keydown", handleKeyPress);
    startResetButton.textContent = "Start";
    durationSelect.disabled = false;
    caseSelect.disabled = false; // Enable case select

    const finalWpm = updateStats(); // Get final WPM
    saveHighScore(finalWpm); // Save high score

    if (paragraphCompleted && correctCharsCount === currentParagraph.length) {
      showMessage("Paragraph completed perfectly!", "success");
    } else if (timeLeft <= 0) {
      showMessage("Time's up!", "info");
    }

    if (currentIndex < paragraphSpans.length && paragraphSpans[currentIndex]) {
      paragraphSpans[currentIndex].classList.remove("current");
    }
  }

  startResetButton.addEventListener("click", () => {
    if (!testActive) {
      startTest();
    } else {
      resetTestState();
    }
  });

  durationSelect.addEventListener("change", () => {
    if (!testActive) {
      // initialDuration = parseInt(durationSelect.value); // This is handled in resetTestState
      // timeLeft = initialDuration;
      // timerDisplay.textContent = `Time: ${formatTime(timeLeft)}`;
      // loadHighScore(); // This is handled in resetTestState which calls loadNewParagraph
      resetTestState(); // Reset to apply changes and load new paragraph/highscore
    }
  });

  caseSelect.addEventListener("change", () => {
    // Event listener for case select
    if (!testActive) {
      // currentCaseType = caseSelect.value; // This is handled in resetTestState
      resetTestState(); // Reload paragraph and high score with new case
    }
  });

  // Initial setup
  resetTestState();
});
