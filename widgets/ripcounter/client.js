document.addEventListener('DOMContentLoaded', () => {
    const ripCounterEl = document.getElementById('rip-counter');
    const socket = io();

    // Listen for the 'rip-update' event
    socket.on('rip-update', (count) => {
        ripCounterEl.textContent = count;
    });
});