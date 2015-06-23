<?php
require_once 'inc.php';

$db = new DB('b8_3729184_games');

if ($_POST['rw'] == 'w') {
  $name = getVar('name', 'dbsafe');
  $score = getVar('score', 'int');
  if ($name != '' && $score > 0) $db->insert('cholscore', array('name'=>$name, 'score'=>$score));
}
$hiscores = $db->select('cholscore', '', "score DESC", 10);
if (is_array($hiscores)) {
  echo("&hscores=");
  for ($i=0; $i<sizeof($hiscores); $i++) {
    echo($hiscores[$i]['score'] . "__" . $hiscores[$i]['name'] . "--");
  }
} else {
  echo("&hscores=");
}
?>