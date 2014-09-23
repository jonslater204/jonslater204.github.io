<!-- DOCTYPE html -->
<html>
<head>
   <title>Colour Chart</title>
</head>
<body>
<form method="post" enctype="multipart/form-data">
   <fieldset>
      <input type="file" name="file" />
      <input type="text" name="url"<?php if (isset($_POST['url'])) {echo " value=\"{$_POST['url']}\"";} ?> />
      <input type="checkbox" name="ignore_first" id="ignore_first"<?php if (isset($_POST['ignore_first']) && strtolower($_POST['ignore_first']) === 'on') {echo ' checked="checked"';} ?> />
      <label for="ignore_first">Ignore Main Colour</label>
      <input type="number" name="steps" value="<?php if (isset($_POST['steps'])) {echo $_POST['steps'];} else {echo 1;} ?>" />
      <input type="submit" name="submit" value="Submit">
   </fieldset>
</form>
<?php
require_once('colourChart.inc.php');
if (isset($_FILES['file']) && $_FILES['file']['name'] !== '') {
  $file = $_FILES['file']['tmp_name'];
  $type = colourChart::typeFromUpload($file);
} elseif (isset($_POST['url'])) {
  $file = $_POST['url'];
  $type = colourChart::typeFromFile($file);
} else {
  $file = FALSE;
}
if ($file) {
  $colourChart = new colourChart($file, $type);
  if (isset($_POST['ignore_first']) && strtolower($_POST['ignore_first']) === 'on') {
    $colourChart->ignoreFirst();
  }
  $colourChart->setSteps($_POST['steps']);
  
  $colourChart->countColours();
  
  echo '<img src="data:image/png;base64,' . base64_encode($colourChart->originalImage()) . '" />';
  echo '<img src="data:image/png;base64,' . base64_encode($colourChart->createChart()) . '" />';
  
  $colourChart->destroyImage('chart');
  $colourChart->destroyImage('image');
}
?>
</body>
</html>
