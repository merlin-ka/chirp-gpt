// ==UserScript==
// @name         Chirp-GPT
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Make Chat-GPT talk with a funny voice.
// @author       merlin-ka (github.com/merlin-ka)
// @match        https://chatgpt.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=chatgpt.com
// @grant        none
// @downloadUrl  https://raw.githubusercontent.com/merlin-ka/chirp-gpt/main/chirp-gpt.user.js
// @updateUrl    https://raw.githubusercontent.com/merlin-ka/chirp-gpt/main/chirp-gpt.user.js
// ==/UserScript==

const PLAY_INTERVAL = 75;
const DETUNE = 500;

const audioContext = new AudioContext();
const gain = audioContext.createGain();
gain.gain.value = 0.5;
gain.connect(audioContext.destination);

function createUi() {
    const header = document.querySelector("main div.sticky");
    if (!header) {
        return;
    }

    const accountButton = header.children[header.children.length - 1];
    if (!accountButton) {
        return;
    }

    const div = document.createElement("div");
    div.id = "chirp-gpt-ui";
    div.className = "flex items-center";

    const label = document.createElement("div");
    label.innerText = "Chirp-GPT Volume:";
    label.style.marginRight = "16px";
    div.appendChild(label);

    const slider = document.createElement("input");
    slider.type = "range";
    slider.value = Math.round(gain.gain.value * 100);
    div.appendChild(slider);

    slider.addEventListener("input", (e) => {
        gain.gain.value = slider.valueAsNumber / 100;
    });

    accountButton.insertAdjacentElement("beforebegin", div);
}

async function createAudioBuffer(waveBase64) {
    const byteString = atob(waveBase64);
    const arrayBuffer = new ArrayBuffer(byteString.length);
    const byteArray = new Uint8Array(arrayBuffer);

    for (let i = 0; i < byteString.length; i++) {
        byteArray[i] = byteString.charCodeAt(i);
    }

    return await audioContext.decodeAudioData(arrayBuffer);
}

function playAudioBuffer(audioBuffer) {
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.detune.value = Math.round(Math.random() * DETUNE);
    source.connect(gain);
    source.start();
}

async function main() {
    const sounds = await Promise.all(wavFiles.map(createAudioBuffer));

    // Play a sound when text is added to the response (detected by the length)
    let previousResponseLength = 0;

    // Timestamp in milliseconds of the last time a sound was played
    let previousPlayTime = 0;

    const observer = new MutationObserver(() => {
        // first, check if the UI is visible
        // (which is not the case on page load and chat navigation)
        if (document.querySelector("#chirp-gpt-ui") == null) {
            createUi();
        }

        if (gain.gain.value == 0) {
            return;
        }

        /** @type {HTMLDivElement} */
        const resultStreamingDiv = document.querySelector("div.result-streaming");

        if (!resultStreamingDiv) {
            previousResponseLength = 0;
            return;
        }

        // check for new content
        if (resultStreamingDiv.innerText.length == previousResponseLength) {
            return;
        }
        previousResponseLength = resultStreamingDiv.innerText.length;

        // prevent sounds from overlapping too much
        const now = Date.now();
        if (now - previousPlayTime < PLAY_INTERVAL) {
            return;
        }
        previousPlayTime = now;

        const idx = Math.round(Math.random() * (sounds.length - 1));
        playAudioBuffer(sounds[idx]);
    });

    observer.observe(document.body, { characterData: true, childList: true, subtree: true });
}

/**
 * The Base64 encoded .wav files (inserted by the script build.py)
 * @type {string[]}
 */
const wavFiles = [
    // PLACE_SOUNDS_HERE
];

(function () {
    main();
})();
