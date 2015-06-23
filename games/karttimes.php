<?php
require_once 'dbi.inc.php';

$db = new DBi('b8_3729184_games');

switch ($_POST['rw']) {
  case 'b':
    $track = getVar('track', 'int', '', FALSE);
    $diffs = $db->select('karttimes', "track = '$track'", "time", 1, '', array('diffs', 'startx', 'starty', 'starta', 'time', 'car'));
    $echoDiffs = "&diffs=";
    if (is_array($diffs)) {
      if ($diffs[0]['diffs'] != '') {
        $echoDiffs = "&track=$track&diffs={$diffs[0]['diffs']}&time={$diffs[0]['time']}&car={$diffs[0]['car']}&startx={$diffs[0]['startx']}&starty={$diffs[0]['starty']}&starta={$diffs[0]['starta']}";
      }
    }
    echo $echoDiffs;
    break;
  case 'w':
    $db->insert('karttimes', array(
       'name'=>getVar('name', '', '', FALSE),
       'time'=>getVar('time', 'int', '', FALSE),
       'car'=>getVar('car', 'int', '', FALSE),
       'track'=>getVar('track', 'int', '', FALSE),
       'startx'=>getVar('startx', 'int', '', FALSE),
       'starty'=>getVar('starty', 'int', '', FALSE),
       'starta'=>getVar('starta', 'int', '', FALSE),
       'ip'=>$_SERVER['REMOTE_ADDR'],
       'agent'=>substr($_SERVER['HTTP_USER_AGENT'], 0, 250),
       'diffs'=>substr(getVar('diffs', '', '', FALSE), 0, 3600),
    ));
  case 'r':
    $times = $db->select('karttimes', "track = '" . getVar('track', 'int', '', FALSE) . "'", "time", 3, '', array('timeid', 'time', 'car', 'track', 'name'));
    if (is_array($times)) {
      for ($i=0; $i<sizeof($times); $i++) {
        echo "&time" . $i . "=" . $times[$i]['time'] . "&name" . $i . "=" . $times[$i]['name'] . "&car" . $i . "=" . $times[$i]['car'];
      }
    } else {
      echo "&time0=&name0=&car0=";
    }
    break;
}
?>