function sortColours(a, b) {
   if (a.count < b.count) {
      return -1;
   } else if (a.count > b.count) {
      return 1;
   } else {
      return 0;
   }
}

function pieChart(e) {
   e.preventDefault();
   e.stopPropagation();
   var image = e.target;
   image.crossOrigin = '';
   var div = document.createElement('div');
   div.style.position = 'absolute';
   div.style.left = e.pageX + 'px';
   div.style.top = e.pageY + 'px';
   div.style.border = '2px black solid';
   div.style.borderRadius = '5px';
   var canvas = document.createElement('canvas');
   canvas.style.width = image.width + 'px';
   canvas.style.height = image.height + 'px';
   canvas.setAttribute('width', image.width);
   canvas.setAttribute('height', image.height);
   var close = document.createElement('a');
   close.href = '#';
   close.onclick = function(e) {e.preventDefault(); this.parentNode.parentNode.removeChild(this.parentNode);};
   close.innerHTML = 'X';
   close.style.position = 'absolute';
   close.style.color="#000";
   close.style.top = 0;
   close.style.right = 0;
   
   div.appendChild(canvas);
   div.appendChild(close);
   
   var total_pixels = image.width * image.height;

   var steps = 1;

   var context = canvas.getContext('2d');

   context.drawImage(image, 0, 0);

   var image_data = context.getImageData(0, 0, image.width, image.height);
   var data = image_data.data;

   var count_colours = [];
  
   for (i=0; i<data.length; i+=4) {
      pixel = (Math.floor(data[i] / steps) * steps)
         + ':' + Math.floor(data[i + 1] / steps) * steps
         + ':' + Math.floor(data[i + 2] / steps) * steps
         + ':' + Math.floor(data[i + 3] / steps) * steps;
      if (typeof(count_colours[pixel]) !== 'undefined') {
         ++count_colours[pixel];
      } else {
         count_colours[pixel] = 1;
      }
   }
   
   var sort_colours = [];
   
   for (i in count_colours) {
      sort_colours.push({pixel: i, count: count_colours[i]});
   }
    
   sort_colours.sort(sortColours);
   sort_colours.reverse();
   
   var size = 200;
   var sizepx = size + 'px';
   div.style.zIndex = 9999;
   div.style.width = sizepx;
   div.style.height = sizepx;
   canvas.style.width = sizepx;
   canvas.style.height = sizepx;
   canvas.setAttribute('width', size);
   canvas.setAttribute('height', size);
   
   var gradient = context.createLinearGradient(0, 0, 0, size);
   gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');   
   gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
   context.fillStyle = gradient;
   context.fillRect(0, 0, size, size);
   
   var start_angle = 0;
   var end_angle;
   var shift_angle = 0.5 * Math.PI;
   
   for (i in sort_colours) {
      end_angle = start_angle + 2 * Math.PI * sort_colours[i].count / total_pixels;
      pixel = sort_colours[i].pixel.split(':');
      context.fillStyle = 'rgba(' + pixel[0] + ', ' + pixel[1] + ', ' + pixel[2] + ', ' + (Math.round(pixel[3] / 2.55) / 100) + ')';
      context.beginPath();
      context.moveTo(size / 2, size / 2);
      context.arc(size / 2, size / 2, size / 2, start_angle - shift_angle, end_angle - shift_angle);
      context.lineTo(size / 2, size / 2);
      context.fill();
      if (2 * Math.PI - start_angle < 0.01) break;
      start_angle = end_angle;
   }
   
   document.body.appendChild(div);
}

var imgs = document.getElementsByTagName('img');

for (i in imgs) {
   if (typeof(imgs[i]) === 'object') imgs[i].addEventListener('click', pieChart);
}