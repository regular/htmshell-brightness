//jshint esversion:6
const proxy = require('htmshell-proxy/client');
const minimist = require('minimist');
const container = document.querySelector('#brightness');
const cookie = container.getAttribute('data-backend');
const slider = container.querySelector('input[type=range]');

function setSliderPosition(x) {
    slider.value = x;
}

const api = {
    setSliderPosition
};

proxy(cookie, api, (err, backend) => {

    const argv = minimist(process.argv.slice(2), {
        default: {
            steps: 100
        }
    });

    terminal.warn('argv', argv);
    terminal.warn('env', process.env);
    slider.max = 1;
    slider.min = 0;
    slider.step = 1 / argv.steps;

    slider.addEventListener('input', () => {
        terminal.log('set brightness to', slider.value);
        backend.setBrightness(slider.value);
    });
});
