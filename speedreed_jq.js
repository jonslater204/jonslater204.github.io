$element = document.createElement('script');
$element.type = 'text/javascript';
$element.onload = init;
$element.src = '//ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js';
document.getElementsByTagName('head')[0].appendChild($element);
var $text, $timer, $word, $speed = 300;
function init() {
   var $style = document.createElement('style');
   $style.type = 'text/css';
   $style.innerHTML = '.read-hover { background-color: yellow; }'
      + '#js-box { display: none; position: fixed; z-index: 204; top: 10px; left: 50%25; width: 60em; max-width: 100%25; height: 9em; margin-left: -30em; background: #000; border-bottom: 2px #FFF solid; color: #FFF; }'
      + '#js-box a { position: absolute; color: #FF0; }'
      + '#js-word { line-height: 3em; font-size: 3em; text-align: center; vertical-align: middle; }'
      + '#js-close { top: 10px; left: 10px; }'
      + '#js-stop { bottom: 10px; right: 10px; display: none; }'
      + '#js-slower { bottom: 10px; right: 51%25; }'
      + '#js-faster { bottom: 10px; left: 51%25; }'
      + '#js-start { bottom: 10px; right: 10px; }';
   document.getElementsByTagName('head')[0].appendChild($style);
   $('body').append('<div id="js-box"><div id="js-word"></div><a id="js-close" href="#Close">Close</a><a id="js-stop" href="#Stop">Stop</a><a id="js-slower" href="#Slower">Slower</a><a id="js-faster" href="#Faster">Faster</a><a id="js-start" href="#Start">Start</a></div>');
   $(document).on('mouseenter', '*', function($e) {
      if ($(this).attr('id') && $(this).attr('id').indexOf('js-')*1 === 0) return;
      $e.stopPropagation();
      $('.read-hover').addClass('read-hover');
      $(this).addClass('read-hover');
   }).on('mouseleave', '*', function($e) {
      if ($(this).attr('id') && $(this).attr('id').indexOf('js-')*1 === 0) return;
      $e.stopPropagation();
      $($e.target).removeClass('read-hover');
   }).on('click', '*', function($e) {
      $el = $($e.target);
      if ($el.attr('id') && $el.attr('id').indexOf('js-')*1 === 0) return;
      $e.stopPropagation();
      $e.preventDefault();
      $('#js-word').text('');
      $('#js-box').css('display', 'block');
      $text = $el.text()
         .replace(/<script .*\/script>/gm, '').replace(/<style .*\/style>/gm, '')
         .replace(/\s+/gm, ' ').split(' ');
      $word = 0;
   });
   $(document).on('click', '#js-close', function($e) {$e.preventDefault(); close();});
   $(document).on('click', '#js-stop', function($e) {$e.preventDefault(); stop();});
   $(document).on('click', '#js-slower', function($e) {$e.preventDefault(); slower();});
   $(document).on('click', '#js-faster', function($e) {$e.preventDefault(); faster();});
   $(document).on('click', '#js-start', function($e) {$e.preventDefault(); start();});
}
function close() {
   stop();
   $('#js-box').remove();
   $(document).off('mouseenter', '*')
      .off('mouseleave', '*')
      .off('click', '*');
}
function stop() {
   clearTimeout($timer);
   $('#js-stop').hide();
   $('#js-start').show();
}
function start() {
   stop();
   $timer = setTimeout(nextWord, $speed);
   $('#js-start').hide();
   $('#js-stop').show();
}
function faster() {
   $speed = Math.round($speed * 0.8);
}
function slower() {
   $speed = Math.round($speed * 1.25);
}
function nextWord() {
   if ($word < $text.length) {
      $('#js-word').text($text[$word]);
      $timer = setTimeout(nextWord, Math.round($speed * (1 + $text[$word].length / 20)));
      ++$word;
   } else {
      stop();
   }
}