// Checks that libroute.js puts episodes on the right channels. Run: node tools/test_libroute.js
// Prints "libroute: all N checks pass" or stops at the first one that fails.
'use strict';
const assert = require('assert');
const R = require('../british-tv/app/src/main/assets/libroute.js');

const shows = {
  sitcoms: { shows: ['Fawlty Towers', 'Bread'] },
  drama: { shows: ['Bergerac', 'Shooting Stars'] },
  gameshows: { shows: ['Supermarket Sweep'] },
  disney: { shows: ['Silly Symphony'] },
  bbc: { shows: [] },
  christmas: { shows: [] },
};
const ep = (id, f, extra) => Object.assign({ id, f, t: id }, extra);
const lib = { shows: [
  { n: 'Fawlty Towers', e: [ep('ft1', 'Fawlty Towers S01E01.mp4', { c: 'S01E01' }), ep('ft-sp', 'Fawlty Towers extra.mp4', { c: 'Special' })] },
  { n: 'Bergerac', net: 'BBC', e: [
    ep('bg1', 'Bergerac S02E03.mp4', { c: 'S02E03' }),
    ep('bg-late', 'Bergerac S09E01.mp4', { c: 'S09E01', a: '2003-01-01' }),
    ep('bg-xmas', 'Bergerac Christmas Special.mp4', { c: 'S05E00', xmas: 1, n: 'Christmas Special', a: '1986-12-26' }),
  ] },
  { n: 'Supermarket Sweep', e: [ep('ss-dated', 'Supermarket Sweep - 4:6:95.mp4', { c: 'Special' }), ep('ss-plain', 'Supermarket Sweep fan video.mp4', { c: 'Special' })] },
  { n: 'Silly Symphony', e: [ep('sy1', 'The Skeleton Dance.mp4', { c: 'Ep 1', a: '1929-08-22' })] },
  { n: 'Bread Winners', e: [ep('bw1', 'Bread Winners S01E01.mp4', { c: 'S01E01' })] },
  { n: 'Shooting Stars', e: [ep('gw', 'Mobile Suit Gundam Wing - S01E26 - The Eternal Flame of the Shooting Stars.mp4', { c: 'S01E26' })] },
  { n: 'Removed Thing', e: [ep('rm1', 'Removed Thing S01E01.mp4', { c: 'S01E01' })] },   // listed, but removed by the scraper
] };
shows.sitcoms.shows.push('Removed Thing');

const out = R.route(lib, shows, [{ name: 'Removed Thing' }]);
const ids = ch => (out[ch] || []).map(r => r.id).sort();
let n = 0;
const check = (got, want, what) => { assert.deepStrictEqual(got, want, what); n++; };

check(ids('sitcoms'), ['ft1'], 'sitcoms: the coded episode only; no "Special", no "Bread Winners", no removed show');
check(ids('drama'), ['bg-xmas', 'bg1'], 'drama: Bergerac in era, not 2003, not the Gundam namesake');
check(ids('bbc'), ['bg-xmas', 'bg1'], 'a BBC show is on the BBC channel as well');
check(ids('christmas'), ['bg-xmas'], 'a Christmas-titled episode goes to Christmas');
check(ids('gameshows'), ['ss-dated'], 'game shows take a dated unnumbered episode, not an undated one');
check(ids('disney'), ['sy1'], 'Disney takes a 1929 short');
check(R.titleFor('Bergerac', { tvm: 1, c: 'S02E03', n: 'Nice Work' }), 'Bergerac S02E03 Nice Work', 'TVmaze title');

check(R.fileYear('Supermarket Sweep - 4:6:95'), 1995, 'M:D:YY');
check(R.fileYear('Chart Show 1984-04-27'), 1984, 'YYYY-MM-DD');
check(R.fileYear('Fifteen to One - TX 15 January 1988'), 1988, 'day month year');
check(R.fileYear('Bread S01E01'), 0, 'no date');
check(R.norm("The Benny Hill Show & Friends"), 'benny hill show and friends', 'norm');

check(R.ytNetChannels("Beadle's About").join(','), 'itv,tv80s', 'YouTube-only show: ITV and the 80s');
check(R.ytNetChannels('The Vicar of Dibley').join(','), 'bbc,tv90s', 'YouTube-only show: BBC and the 90s');
check(R.ytNetChannels('Unknown Show').length, 0, 'unknown YouTube show: no extra channel');

// a file named for another show is not this show's, but a sequel or a file naming this show is
const names = { 'charlie brown and snoopy show': 1, 'yes prime minister': 1, 'fireman sam': 1 };
const wof = { n: 'Wheel of Fortune' };
check(R.wrongShow(wof, { id: 'wof-x', f: 'The Charlie Brown and Snoopy Show A Charlie Brown Christmas.mp4' }, undefined, names), true, 'another show by name');
check(R.wrongShow({ n: 'Pingu' }, { id: 'p', f: 'fireman-sam-s03e02-a-spot-of-bother.mp4' }, undefined, names), true, 'Fireman Sam filed under Pingu');
check(R.wrongShow({ n: 'QI' }, { id: 'q', f: 'Fireman Sam Brass Band.mp4' }, undefined, names), false, 'a name under 5 letters is never judged');
check(R.wrongShow({ n: 'Yes Minister' }, { id: 'ym', f: 'Yes, Prime Minister Series 1 Side A3.mp4' }, undefined, names), false, 'a sequel shares a word: kept');
check(R.wrongShow(wof, { id: 'wof-y', f: 'Wheel of Fortune 1987 The Charlie Brown and Snoopy Show.mp4' }, undefined, names), false, 'names this show: kept');
check(R.wrongShow(wof, { id: 'fav-wheel_list', f: 'Its Potty Time.mp4' }, undefined, names), true, 'a favourites list file that does not name the show');
check(R.wrongShow(wof, { id: 'fav-wheel_list', f: 'Wheel of Fortune 1988-01-04.mp4' }, undefined, names), false, 'a favourites list file that names the show');

console.log('libroute: all ' + n + ' checks pass');
