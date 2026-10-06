export const updateTimeDisplay = () =>
    ((document.getElementById('update-time') as HTMLElement).textContent = new Date().toLocaleTimeString());
