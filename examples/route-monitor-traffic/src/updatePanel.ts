export const updateTimeDisplay = () =>
    (document.getElementById('update-time')!.textContent = new Date().toLocaleTimeString());
