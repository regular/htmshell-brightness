//jshint esversion:6
const proxy = require('htmshell-proxy/client');

const container = document.querySelector('#brightness');
const cookie = container.getAttribute('data-backend');
const slider = container.querySelector('input[type=range]');

slider.max = 1;
slider.min = 0;
slider.step = 0.01;

function setSliderPosition(x) {
    slider.value = x;
}

const api = {
    setSliderPosition
};

proxy(cookie, api, (err, backend) => {
    slider.addEventListener('input', () => {
        backend.setBrightness(slider.value);
    });
});
