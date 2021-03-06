#!/usr/bin/env node
//jshint esversion:6
const fs = require('fs');
const BufferList = require('bl');
//const multi = require('multistream');
const combine = require('combine-streams');
const trumpet = require('trumpet');
const browserify = require('browserify');
const debug = require('debug')('brightness-backend');

const {startAPC, endAPC} = require('html-terminal/apc-sequence');

function makeFrontend(html, scriptFilename) {
    let tr = trumpet();

    // NOTE: when we use multistream, trumpet does not
    // output any data.
    combine()
        .append(startAPC('removeChild body #brightness', {}))
        .append(endAPC())
        .append(startAPC('appendChild body', {
            'Content-Type': 'text/html'
        }))
        .append(tr)
        .append(endAPC())
        .append(null)
        .pipe(process.stdout, {end: false});

    let scriptSink = tr.select('script').createWriteStream();
    b = browserify();
    b.add(scriptFilename);
    let bundle = b.bundle();
    bundle.on('error', (err)=>{throw err;});
    bundle.pipe(scriptSink);
    tr.end(html);
}

let html = (cookie) =>`
    <div id="brightness" data-backend="${cookie}" style="position: absolute;">
        <input type="range">
        <script>
        </script>
    </div>
`;
const proxy = require('htmshell-proxy/backend');
const cookie = proxy.randomCookie();
const syspath = '/sys/class/backlight/intel_backlight';

let maxBrightness = Number(fs.readFileSync(`${syspath}/max_brightness`, {encoding: 'ascii'}));
let currentBrightness = Number(fs.readFileSync(`${syspath}/brightness`, {encoding: 'ascii'}));
// fail early in case of permission problems
try {
    fs.writeFileSync(`${syspath}/brightness`, `${currentBrightness}`, {encoding: 'ascii'});
} catch(e) {
    console.error(`Unable to set backlight brightness: ${e.message}`);
    process.exit(2);
}

makeFrontend(html(cookie), './client.js');

process.on('SIGINT', function () {
    let stream = combine()
        .append(startAPC('removeChild body #brightness', {}))
        .append(endAPC())
        .append(null);
    stream.on('end', ()=>{
        process.exit(0);
    });
    stream.pipe(process.stdout);
});

function setBrightness(b) {
    b = Math.round(maxBrightness * b);
    debug(`set brightness to ${b}`);
    fs.writeFileSync(`${syspath}/brightness`, `${b}`, {encoding: 'ascii'});
}

const api = {
    setBrightness
};

proxy(cookie, api, (err, ui) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    ui.setSliderPosition(currentBrightness / maxBrightness);
});
