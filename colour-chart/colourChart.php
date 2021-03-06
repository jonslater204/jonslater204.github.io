<!-- DOCTYPE html -->
<html>
<head>
   <title>Colour Chart</title>
</head>
<body>
<h3>Create Colour Frequency Pie Charts from Images</h3>
<form method="post" enctype="multipart/form-data">
   <fieldset>
      <input type="file" name="file" /><br />
      <label for="url">Use URL</label>
      <input id="url" type="text" name="url"<?php if (isset($_POST['url'])) {echo " value=\"{$_POST['url']}\"";} ?> /><br />
      <label for="ignore_first">Ignore Main Colour</label>
      <input type="checkbox" name="ignore_first" id="ignore_first"<?php if (isset($_POST['ignore_first']) && strtolower($_POST['ignore_first']) === 'on') {echo ' checked="checked"';} ?> /><br />
      <label for="steps">Colour Steps</label>
      <input id="steps" type="number" name="steps" value="<?php if (isset($_POST['steps'])) {echo $_POST['steps'];} else {echo 1;} ?>" /><br />
      <input type="submit" name="submit" value="Submit">
   </fieldset>
</form>
<p>Bookmarklet: (Clicking on images will generate the chart)</p>
<p style="font-size: 50%;">javascript:function sc(e,t){if(e.z<t.z){return-1}else if(e.z>t.z){return 1}else{return 0}}function pc(e){e.preventDefault();e.stopPropagation();var t=e.target;t.crossOrigin="";var n=document.createElement("div");n.style.position="absolute";n.style.left=e.pageX+"px";n.style.top=e.pageY+"px";n.style.border="2px black solid";n.style.borderRadius="5px";var r=document.createElement("canvas");r.style.width=t.width+"px";r.style.height=t.height+"px";r.setAttribute("width",t.width);r.setAttribute("height",t.height);var s=document.createElement("a");s.href="#";s.onclick=function(e){e.preventDefault();this.parentNode.parentNode.removeChild(this.parentNode)};s.innerHTML="X";s.style.position="absolute";s.style.color="#000";s.style.top=0;s.style.right=0;n.appendChild(r);n.appendChild(s);var o=t.width*t.height;var u=1;var a=r.getContext("2d");a.drawImage(t,0,0);var f=a.getImageData(0,0,t.width,t.height);var l=f.data;var c=[];for(i=0;i<l.length;i+=4){x=Math.floor(l[i]/u)*u+":"+Math.floor(l[i+1]/u)*u+":"+Math.floor(l[i+2]/u)*u+":"+Math.floor(l[i+3]/u)*u;if(typeof c[x]!=="undefined"){++c[x]}else{c[x]=1}}var h=[];for(i in c){h.push({x:i,z:c[i]})}h.sort(sc);h.reverse();var p=200;var d=p+"px";n.style.zIndex=9999;n.style.width=d;n.style.height=d;r.style.width=d;r.style.height=d;r.setAttribute("width",p);r.setAttribute("height",p);var v=a.createLinearGradient(0,0,0,p);v.addColorStop(0,"rgba(255, 255, 255, 1)");v.addColorStop(1,"rgba(255, 255, 255, 0)");a.fillStyle=v;a.fillRect(0,0,p,p);var m=0;var g;var y=.5*Math.PI;for(i in h){g=m+2*Math.PI*h[i].z/o;x=h[i].x.split(":");a.fillStyle="rgba("+x[0]+", "+x[1]+", "+x[2]+", "+Math.round(x[3]/2.55)/100+")";a.beginPath();a.moveTo(p/2,p/2);a.arc(p/2,p/2,p/2,m-y,g-y);a.lineTo(p/2,p/2);a.fill();if(2*Math.PI-m<.01)break;m=g}document.body.appendChild(n)}var w=document.getElementsByTagName("img");for(i in w){if(typeof w[i]==="object")w[i].addEventListener("click",pc)}</p>
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
