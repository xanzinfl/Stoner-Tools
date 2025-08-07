document.addEventListener('DOMContentLoaded', () => {
    const countdownTimerEl = document.getElementById('countdown-timer');
    const timezoneInfoEl = document.getElementById('timezone-info');
    const localTimeInfoEl = document.getElementById('local-time-info');
    const saveBtn = document.getElementById('save-btn');
    const ripCountDisplay = document.getElementById('ripCountDisplay');
    const statusEl = document.getElementById("status");
    
    const fields = [
        'notification-text', 'clientId', 'state', 'details', 'filePath',
        'b1Label', 'b1Url', 'b2Label', 'b2Url', 'largeImageKey',
        'largeImageText', 'smallImageKey', 'smallImageText',
        'minimize-to-tray', 'startup'
    ];
    const inputs = {};
    fields.forEach(id => {
        inputs[id.replace(/-/g, '')] = document.getElementById(id);
    });

    async function loadSettings() {
        const settings = await window.electronAPI.getSettings();
        inputs.notificationtext.value = settings.notificationText;
        inputs.clientId.value = settings.clientId;
        inputs.state.value = settings.state;
        inputs.details.value = settings.details;
        inputs.filePath.value = settings.filePath;
        inputs.b1Url.value = settings.button1Url;
        inputs.b1Label.value = settings.button1Label;
        inputs.b2Url.value = settings.button2Url;
        inputs.b2Label.value = settings.button2Label;
        inputs.largeImageKey.value = settings.largeImageKey;
        inputs.largeImageText.value = settings.largeImageText;
        inputs.smallImageKey.value = settings.smallImageKey;
        inputs.smallImageText.value = settings.smallImageText;
        inputs.minimizetotray.checked = settings.minimizeToTray;
        inputs.startup.checked = settings.runOnStartup;
    }

    function saveSettings() {
        const settings = {
            notificationText: inputs.notificationtext.value,
            clientId: inputs.clientId.value,
            state: inputs.state.value,
            details: inputs.details.value,
            filePath: inputs.filePath.value,
            button1Url: inputs.b1Url.value,
            button1Label: inputs.b1Label.value,
            button2Url: inputs.b2Url.value,
            button2Label: inputs.b2Label.value,
            largeImageKey: inputs.largeImageKey.value,
            largeImageText: inputs.largeImageText.value,
            smallImageKey: inputs.smallImageKey.value,
            smallImageText: inputs.smallImageText.value,
            minimizeToTray: inputs.minimizetotray.checked,
            runOnStartup: inputs.startup.checked,
        };
        window.electronAPI.saveSettings(settings);
        const originalText = saveBtn.textContent;
        saveBtn.textContent = 'Saved!';
        setTimeout(() => {
            saveBtn.textContent = originalText;
        }, 1500);
    }

    window.electronAPI.onUpdate((data) => {
        if (data.is420) {
            countdownTimerEl.textContent = "It's 4:20!";
            timezoneInfoEl.textContent = `Right now in ${data.timezone}`;
            localTimeInfoEl.textContent = `(Thats ${data.localTime} for you)`;
        } else {
            countdownTimerEl.textContent = data.countdown;
            timezoneInfoEl.textContent = `The next 4:20 is in ${data.timezone}`;
            localTimeInfoEl.textContent = `(Thats ${data.localTime} for you)`;
        }
    });

    window.electronAPI.onRipUpdate((count) => {
        ripCountDisplay.textContent = `Rips: ${count}`;
    });

    window.adjustRip = async (action) => {
        await window.electronAPI.adjustRipCount(action);
    };

    async function startRPC() {
        saveSettings(); 
        const settings = await window.electronAPI.getSettings();
        window.electronAPI.startRPC(settings);
    }

    function stopRPC() {
        window.electronAPI.stopRPC();
    }
    
    function updateStatus(connected) {
      statusEl.textContent = connected ? "🟢 Connected" : "🔴 Disconnected";
    }

    window.adjustRip = adjustRip;
    window.startRPC = startRPC;
    window.stopRPC = stopRPC;

    saveBtn.addEventListener('click', saveSettings);
    
    window.electronAPI.onRpcStatus((isConnected) => {
        updateStatus(isConnected);
    });

    loadSettings();
    updateRipDisplay();
    setInterval(updateRipDisplay, 5000);
});