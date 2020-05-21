var $map = {
   map: null,
   drawingManager: null,
   route_id: null,
   load_route: null,
   del_route: null,
   points: [],
   markers: [],
   polyline: null,
   progress_points: null,
   progress_line: null,
   distance_format: function($d) {
      if (document.getElementById('js-unit').value === 'km') {
         if ($d < 1000) {
            return Math.round($d) + ' m';
         } else {
            return Math.round($d / 10) / 100 + ' km';
         }
      } else {
         $d = $d * 1.0936133;
         if ($d < 1760) {
            return Math.round($d) + ' yards';
         } else {
            return Math.round($d / 17.6) / 100 + ' miles';
         }
      }
   },
   loadRoutes: function() {
      $.ajax('/lo/route-loadall.php', {
         type: 'post',
         dataType: 'json'
      })
      .done(function($data) {
         if ($data !== null) {
            if ($data.response === 'loaded') {
               $($mapConfig.menu).prepend($data.routes);
            }
         }
      });
   },
   loadRoute: function($r) {
      $map.load_route = $r;
      $('#js-message').text('Loading...');
      $.ajax('/lo/route-load.php', {
         data: { routeid: $r },
         type: 'post',
         dataType: 'json'
      })
      .done(function($data) {
         if ($data !== null) {
            if ($data.response === 'loaded') {
               if ($mapConfig.mobile && $map.load_route > 0) {
                  $('html, body').animate({scrollTop: $('#map-canvas').offset().top - 50}, 300);
               }
               $map.points = google.maps.geometry.encoding.decodePath($data.route.route);
               $map.clearMarkers();
               for (var $i=0; $i<$map.points.length; ++$i) {
                  if ($i === 0 || $i === $map.points.length - 1) {
                     var $marker = new google.maps.Marker({
                        map: $map.map,
                        title: ($i === 0) ? 'Start' : 'Finish',
                        position: $map.points[$i],
                        draggable: true
                     });
                     google.maps.event.addDomListener($marker, 'dragend', function() {
                        $map.points[(this.getTitle() === 'Start') ? 0 : $map.points.length - 1] = this.getPosition();
                        $map.redrawLine();
                     });
                     $map.markers.push($marker);
                  }
               }
               $('#js-message').text('');
               $('#js-name').val($data.route.name);
               $('#js-unit').val(($data.route.unit*1 === 1) ? 'km' : 'miles');
               if ($mapConfig.mobile) {
                  $('#js-unit').selectmenu('refresh');
               }
               $('#js-progress').val(Math.round($data.route.progress * 100) / 100);
               $map.toggleMode(false);
               $map.redrawLine();
               $map.zoomFit();
               $map.route_id = $data.route.routeid;
               $map.drawingManager.setOptions({
                  drawingMode: null
               });
            } else {
               $('#js-message').text(($map.load_route === 0) ? '' : 'Load failed');
            }
         } else {
            $('#js-message').text('Load failed');
         }
      })
      .fail(function() {
         $('#js-message').text(($map.load_route === 0) ? '' : 'Load failed');
      });
   },
   deleteRoute: function($r) {
      $map.del_route = $r;
      $('#js-message').text('Deleting...');
      $.ajax('/lo/route-delete.php', {
         data: { routeid: $r },
         type: 'post',
         dataType: 'json'
      })
      .done(function($data) {
         if ($data !== null) {
            if ($data.response === 'deleted') {
               $('#js-del' + $map.del_route).parent().text('DELETED');
               $('#js-message').text('');
               $map.route_id = 0;
            } else {
               $('#js-message').text(($map.del_route === 0) ? '' : 'Delete failed');
            }
         } else {
            $('#js-message').text('Delete failed');
         }
      })
      .fail(function() {
         $('#js-message').text(($map.del_route === 0) ? '' : 'Delete failed');
      });
   },
   toggleMode: function($edit) {
      if ($edit) {
         $map.polyline.setEditable(true);
         var $marker;
         for (var $i in $map.markers) {
            $marker = $map.markers[$i];
            $marker.setVisible(true);
         }
         document.getElementById('js-edit').innerHTML = 'Edit Mode';
      } else {
         $map.polyline.setEditable(false);
         var $marker;
         for (var $i in $map.markers) {
            $marker = $map.markers[$i];
            $marker.setVisible(false);
         }
         document.getElementById('js-edit').innerHTML = 'View Mode';
      }
   },
   zoomFit: function() {
      var $bounds = new google.maps.LatLngBounds();
      for (var $i=0; $i<$map.points.length; ++$i) {
         $bounds.extend($map.points[$i]);
      }
      $map.map.fitBounds($bounds);
   },
   clearMarkers: function() {
      for (var $i in $map.markers) {
         $map.markers[$i].setMap(null);
      }
      $map.markers = [];
   },
   updateMarkers: function() {
      $map.points = $map.polyline.getPath().getArray();
      if ($map.markers.length > 0) {
         $map.markers[0].setPosition($map.points[0]);
         if ($map.markers.length > 1) {
            $map.markers[1].setPosition($map.points[$map.points.length - 1]);
         }
      }
   },
   redrawProgress: function() {
      if ($map.progress_line !== null) $map.progress_line.setMap(null);
      var $progress = document.getElementById('js-progress').value * 1000;
      if (document.getElementById('js-unit').value !== 'km') $progress *= 1.609344;
      if ($progress === 0) return;
      $map.progress_points = [$map.points[0]];
      for (var $i=1; $i<$map.points.length; ++$i) {
         $progress -= google.maps.geometry.spherical.computeDistanceBetween($map.points[$i], $map.points[$i - 1]);
         if ($progress >= 0) {
            $map.progress_points.push($map.points[$i]);
            if ($progress < 1) break;
         } else {
            var $lat_diff = $map.points[$i].lat() - $map.points[$i - 1].lat();
            var $lng_diff = $map.points[$i].lng() - $map.points[$i - 1].lng();
            var $section = google.maps.geometry.spherical.computeDistanceBetween ($map.points[$i], $map.points[$i - 1]);
            $map.progress_points.push(new google.maps.LatLng($map.points[$i].lat() + $lat_diff * $progress / $section,
               $map.points[$i].lng() + $lng_diff * $progress / $section));
            break;
         }
      }
      $map.progress_line.setPath($map.progress_points);
      $map.progress_line.setMap($map.map);
   },
   redrawLine: function() {
      if ($map.polyline !== null) $map.polyline.setMap(null);
      $distance = 0;
      if ($map.points.length > 1) {
         $map.polyline.setPath($map.points);
         $map.polyline.setMap($map.map);
         for (var $i=1; $i<$map.points.length; ++$i) {
            $distance += google.maps.geometry.spherical.computeDistanceBetween ($map.points[$i], $map.points[$i - 1]);
         }
      }
      var $path = $map.polyline.getPath();
      google.maps.event.addDomListener($path, 'insert_at', function() {
         $map.updateMarkers();
         $map.redrawLine();
      });
      google.maps.event.addDomListener($path, 'set_at', function() {
         $map.updateMarkers();
         $map.redrawLine();
      });
      document.getElementById('js-distance').innerHTML = $map.distance_format($distance);
      $map.redrawProgress();
   },
   init: function() {
      $map.loadRoutes();
      var $map_width = $('#map-canvas').closest($mapConfig.container).width();
      $('#map-canvas').css('width', Math.floor($map_width) + 'px');
      $('#map-canvas').css('height', Math.floor((3 * $map_width / 4)) + 'px');
      if ($mapConfig.autoload) {
         $map.loadRoute(0);
      }
   },
   googleInit: function() {
      $map.polyline = new google.maps.Polyline({
         path: [],
         strokeColor: 'red',
         strokeOpacity: .75,
         strokeWeight: 5,
         editable: true
      });
      $map.progress_line = new google.maps.Polyline({
         path: [],
         strokeColor: 'yellow',
         strokeOpacity: .75,
         strokeWeight: 4,
         zIndex: 1
      });
      var $mapOptions = {
         center: { lat: 52, lng: 0 },
         zoom: 8
      };
      $map.map = new google.maps.Map(document.getElementById('map-canvas'), $mapOptions);
      var $drawOptions = {
         drawingMode: google.maps.drawing.OverlayType.MARKER,
         drawingControl: true,
         drawingControlOptions: {
            position: google.maps.ControlPosition.TOP_CENTER,
            drawingModes: [google.maps.drawing.OverlayType.MARKER]
         }
      };
      $map.drawingManager = new google.maps.drawing.DrawingManager($drawOptions);
      $map.drawingManager.setMap($map.map);
      google.maps.event.addListener($map.drawingManager, 'markercomplete', function($marker) {
         if ($map.polyline.getEditable()) {
            if ($map.markers.length === 2) {
               var $old_marker = $map.markers.pop();
               $old_marker.setMap(null);
            }
            $marker.setTitle(($map.markers.length === 0) ? 'Start' : 'Finish');
            google.maps.event.addDomListener($marker, 'dragend', function() {
               $map.points[(this.getTitle() === 'Start') ? 0 : $map.points.length - 1] = this.getPosition();
               $map.redrawLine();
            });
            $map.points.push($marker.getPosition());
            $map.markers.push($marker);
            $map.redrawLine();
         } else {
            $marker.setMap(null);
         }
      });
      google.maps.event.addDomListener(document.getElementById('js-zoom'), 'click', function() {
         $map.zoomFit();
      });
      google.maps.event.addDomListener(document.getElementById('js-clear'), 'click', function() {
         if (confirm('Clear the whole route?')) {
            $map.clearMarkers();
            $map.points = [];
            $map.redrawLine();
         }
      });
      if ($.isFunction($.fn.on)) {
         $(document).on('click', '.js-load', function($e) {
            $e.preventDefault();
            $map.loadRoute($(this).attr('id').replace(/[^0-9]/g, ''));
         });
         $(document).on('click', '.js-del', function($e) {
            $e.preventDefault();
            var $r = $(this).attr('id').replace(/[^0-9]/g, '');
            if (confirm('Delete ' + $('#js-load' + $r).text() + '?')) {
               $map.deleteRoute($r);
            }
         });
      } else {
         $('.js-load').live('click', function($e) {
            $e.preventDefault();
            $map.loadRoute($(this).attr('id').replace(/[^0-9]/g, ''));
         });
         $('.js-del').live('click', function($e) {
            $e.preventDefault();
            var $r = $(this).attr('id').replace(/[^0-9]/g, '');
            if (confirm('Delete ' + $('#js-load' + $r).text() + '?')) {
               $map.deleteRoute($r);
            }
         });
      }
      $('#js-save').click(function($e) {
         $e.preventDefault();
         $('#js-message').text('Saving...');
         $.ajax('/lo/route-save.php', {
            data: {
               routeid: $map.route_id,
               route: google.maps.geometry.encoding.encodePath($map.points),
               name: $('#js-name').val(),
               progress: $('#js-progress').val(),
               unit: ($('#js-unit').val() === 'km') ? 1 : 0
            },
            type: 'post',
            dataType: 'json'
         })
         .done(function($data) {
            if ($data !== null) {
               $('#js-message').text(($data.response === 'saved') ? 'Saved' : 'Save failed');
            } else {
               $('#js-message').text('Save failed');
            }
         })
         .fail(function() {
            $('#js-message').text('Save failed');
         });
      });
      google.maps.event.addDomListener(document.getElementById('js-view'), 'click', function() {
         $map.redrawProgress();
      });
      google.maps.event.addDomListener(document.getElementById('js-edit'), 'click', function() {
         $map.toggleMode(!$map.polyline.getEditable());
      });
      google.maps.event.addDomListener($map.polyline, 'dblclick', function($mev){
         if ($mev.vertex !== undefined) {
            $map.polyline.getPath().removeAt($mev.vertex);
            $map.points = $map.polyline.getPath().getArray();
            if ($mev.vertex === 0) {
               if ($map.points.length > 0) {
                  $map.markers[0].setPosition($map.points[0]);
                  if ($map.points.length === 1) {
                     $map.markers[1].setMap(null);
                  }
               } else {
                  $map.markers[0].setMap(null);
               }
            } else if ($mev.vertex === $map.points.length) {
               if ($map.points.length > 0) {
                  if ($map.points.length === 1) {
                     $map.markers[1].setMap(null);
                  } else {
                     $map.markers[1].setPosition($map.points[$map.points.length - 1]);
                  }
               } else {
                  $map.markers[1].setMap(null);
               }
            }
            $map.redrawLine();
         }
      });
      google.maps.event.addDomListener(document.getElementById('js-unit'), 'change', function() {
         $map.redrawLine();
      });
      $('#js-new').click(function() {
         $map.route_id = 0;
         $('#js-name').val('');
      });
   }
}
if ($mapConfig.mobile) {
   $(document).on('pageshow', function() {
      $map.init();
   });
} else {
   $map.init();
}
google.maps.event.addDomListener(window, 'load', $map.googleInit());