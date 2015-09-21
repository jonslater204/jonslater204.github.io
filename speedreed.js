var $text, $timer, $word, $speed = 300;
var $style = document.createElement('style');
$style.type = 'text/css';
$style.innerHTML = '.read-hover { background-color: yellow; }'
   + '#js-box { display: none; font-family: serif; position: fixed; z-index: 204; top: 10px; left: 50%25; width: 60em; max-width: 100%25; height: 9em; margin-left: -30em; background: #000; border-bottom: 2px #FFF solid; color: #FFF; }'
   + '#js-box a { position: absolute; color: #FF0; }'
   + '#js-word { line-height: 3em; font-size: 3em; text-align: center; vertical-align: middle; }'
   + '#js-close { top: 10px; left: 10px; }'
   + '#js-stop { bottom: 10px; right: 10px; display: none; }'
   + '#js-slower { bottom: 10px; right: 51%25; }'
   + '#js-faster { bottom: 10px; left: 51%25; }'
   + '#js-start { bottom: 10px; right: 10px; }';
document.getElementsByTagName('head')[0].appendChild($style);
var box = document.createElement('div');
box.setAttribute('id', 'js-box');
var node = document.createElement('div');
node.setAttribute('id', 'js-word');
box.appendChild(node);
node = document.createElement('a');
node.setAttribute('id', 'js-close');
node.setAttribute('href', '#Close');
node.textContent = 'Close';
box.appendChild(node);
node = document.createElement('a');
node.setAttribute('id', 'js-stop');
node.setAttribute('href', '#Stop');
node.textContent = 'Stop';
box.appendChild(node);
node = document.createElement('a');
node.setAttribute('id', 'js-slower');
node.setAttribute('href', '#slower');
node.textContent = 'Slower';
box.appendChild(node);
node = document.createElement('a');
node.setAttribute('id', 'js-faster');
node.setAttribute('href', '#Faster');
node.textContent = 'Faster';
box.appendChild(node);
node = document.createElement('a');
node.setAttribute('id', 'js-start');
node.setAttribute('href', '#Start');
node.textContent = 'Start';
box.appendChild(node);
document.getElementsByTagName('body')[0].appendChild(box);
document.getElementById('js-close').addEventListener('click', function($e) {$e.preventDefault(); close();});
document.getElementById('js-stop').addEventListener('click', function($e) {$e.preventDefault(); stop();});
document.getElementById('js-slower').addEventListener('click', function($e) {$e.preventDefault(); slower();});
document.getElementById('js-faster').addEventListener('click', function($e) {$e.preventDefault(); faster();});
document.getElementById('js-start').addEventListener('click', function($e) {$e.preventDefault(); start();});
var $divs = document.getElementsByTagName('div');
for ($d in $divs) {
   $divs.item($d).addEventListener('click', read);
}
function read($e) {
   $el = $e.target;
   if ($el.getAttribute('id') && $el.getAttribute('id').indexOf('js-')*1 === 0) return;
   $e.stopPropagation();
   $e.preventDefault();
   document.getElementById('js-word').textContent = '';
   document.getElementById('js-box').style.display = 'block';
   $text = $el.textContent
      .replace(/<script .*\/script>/gm, '').replace(/<style .*\/style>/gm, '')
      .replace(/\s+/gm, ' ').split(' ');
   $word = 0;
}
function close() {
   stop();
   var $divs = document.getElementsByTagName('div');
   for ($d in $divs) {
      $divs.item($d).removeEventListener('click', read);
   }
   document.getElementsByTagName('body')[0].removeChild(document.getElementById('js-box'));
}
function stop() {
   clearTimeout($timer);
   document.getElementById('js-stop').style.display = 'none';
   document.getElementById('js-start').style.display = '';
}
function start() {
   stop();
   $timer = setTimeout(nextWord, $speed);
   document.getElementById('js-start').style.display = 'none';
   document.getElementById('js-stop').style.display = '';
}
function faster() {
   $speed = Math.round($speed * 0.8);
}
function slower() {
   $speed = Math.round($speed * 1.25);
}
function nextWord() {
   if ($word < $text.length) {
      document.getElementById('js-word').textContent = $text[$word];
      $timer = setTimeout(nextWord, Math.round($speed * (1 + $text[$word].length / 20)));
      ++$word;
   } else {
      stop();
   }
}