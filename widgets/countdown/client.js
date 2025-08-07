document.addEventListener('DOMContentLoaded', () => {
    const countdownTimerEl = document.getElementById('countdown-timer');
    const timezoneInfoEl = document.getElementById('timezone-info');

    const socket = io();

    socket.on('update', (data) => {
        if (data.is420) {
            countdownTimerEl.textContent = "It's 4:20!";
            timezoneInfoEl.textContent = `Right now in ${data.timezone}`;
        } else {
            countdownTimerEl.textContent = data.countdown;
            timezoneInfoEl.textContent = `The next 4:20 is in ${data.timezone}`;
        }
    });
});