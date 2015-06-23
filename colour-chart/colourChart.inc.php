<?php
/**
 * Produce a pie chart of the frequencies of colours used in an image
 */
class colourChart {

  private $chart_width = 200;
  private $chart_height = 200;

  private $image = NULL;
  private $chart = NULL;
  private $width = NULL;
  private $height = NULL;
  private $file = NULL;
  private $type = NULL;
  
  private $ignore_first = FALSE;
  private $steps = 1;
  
  private $colours = array();

  public function __construct($file, $type) {
  
    $this->file = $file;
    $this->type = $type;
    
    switch ($this->type) {
    
      case 'gif':
        $this->image = imagecreatefromgif($this->file);
        break;
        
      case 'jpg':
        $this->image = imagecreatefromjpeg($this->file);
        break;
        
      case 'png':
        $this->image = imagecreatefrompng($this->file);
        break;
        
      default:
        die('Unsupported file type');
        break;
        
    }
    
    $background_colour = imagecolorallocate($this->image, 0, 0, 0);
    imagecolortransparent($this->image, $background_colour);
    
    $this->width = imagesx($this->image);
    $this->height = imagesy($this->image);
    
  }
  
  /**
   * Choose custom size for output image
   */
  public function chartSize($x, $y) {
  
    $this->chart_width = (int) $x;
    $this->chart_height = (int) $y;
    
  }
  
  /**
   * Use this to omit the most common colour (possibly the background)
   */
  public function ignoreFirst() {
  
    $this->ignore_first = TRUE;
    
  }
  
  /**
   * Increasing the sensitivty limits the number of colours in the output
   */
  public function setSteps($steps) {
  
    $this->steps = (int) $steps;
    
    if ($this->steps === 0) $this->steps = 1;
    
  }
  
  /**
   * Generate the array of colour frequencies, keyed by r:g:b:a
   */
  public function countColours() {
  
    for ($x=0; $x<$this->width; ++$x) {
    
      for ($y=0; $y<$this->height; ++$y) {
      
        $pixel = imagecolorsforindex($this->image, imagecolorat($this->image, $x, $y));
        $pixel = floor($pixel['red'] / $this->steps) * $this->steps
          . ':' . floor($pixel['green'] / $this->steps) * $this->steps
          . ':' . floor($pixel['blue'] / $this->steps) * $this->steps
          . ':' . floor($pixel['alpha'] / $this->steps) * $this->steps;
        $this->colours[$pixel] = (isset($this->colours[$pixel])) ? $this->colours[$pixel] + 1 : 1;
        
      }

    }
    
    asort($this->colours);
    $this->colours = array_reverse($this->colours, TRUE);
    
  }
  
  /**
   * Generate the output graphic
   */
  public function createChart() {
  
    $total_pixels = $this->width * $this->height;
    
    if ($this->ignore_first) {
    
      $total_pixels -= reset($this->colours);
      array_shift($this->colours);
      
    }
    
    $this->chart = imagecreatetruecolor($this->chart_width, $this->chart_height);
    imagealphablending($this->chart, FALSE);
    imagesavealpha($this->chart, TRUE);
    $background_color = imagecolorallocatealpha($this->chart, 255, 255, 255, 0);
    imagefill($this->chart, 0, 0, $background_color);
    
    $angle_start = 270;
    foreach ($this->colours as $colour=>$freq) {
    
      $col_split = explode(':', $colour);
      $col = imagecolorallocatealpha($this->chart, $col_split[0], $col_split[1], $col_split[2], $col_split[3]);
      $angle_end = (round($angle_start + 360 * $freq / $total_pixels)) % 360;
      if ($angle_end === $angle_start) break;
      imagefilledarc($this->chart, round($this->chart_width / 2), round($this->chart_height / 2),
        $this->chart_width, $this->chart_height, $angle_start, $angle_end, $col, IMG_ARC_PIE);
      $angle_start = $angle_end;
      
    }
  
    ob_start();
    
    imagepng($this->chart);
    
    return ob_get_clean();
  }
  
  /**
   * Output the original image
   */
  public function originalImage() {
  
    ob_start();
    
    switch ($this->type) {
    
      case 'gif':
        imagegif($this->image);
        break;
        
      case 'jpg':
        imagejpeg($this->image);
        break;
        
      case 'png':
        imagepng($this->image);
        break;
    }
    
    return ob_get_clean();
    
  }
  
  /**
   * Release system resources for an image
   */
  public function destroyImage($image) {
  
    imagedestroy($this->$image);
    
  }
  
  /**
   * Determine the filetype from an uploaded file
   */
  public static function typeFromUpload($file) {
  
    switch ($_FILES['file']['type']) {
    
      case 'image/jpeg':
      case 'image/jpg':
      case 'image/pjpeg':
        return 'jpg';
        break;
        
      case 'image/png':
      case 'image/x-png':
        return 'png';
        break;
        
      case 'image/gif':
        return 'gif';
        break;
        
      default:
        return FALSE;
        break;
        
    }
  }
  
  /**
   * Determine the filetype of a linked image
   */
  public static function typeFromFile($file) {
  
    if ($file == '') return NULL;
  
    switch (exif_imagetype($file)) {
    
      case IMAGETYPE_GIF:
        return 'gif';
        break;
        
      case IMAGETYPE_JPEG:
        return 'jpg';
        break;
        
      case IMAGETYPE_PNG:
        return 'png';
        break;
        
      default:
        return FALSE;
        break;
        
    }
  }

}
?>
