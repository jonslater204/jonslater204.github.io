var $map = {
   map: null,
   drawingManager: null,
   route_id: 0,
   load_route: null,
   del_route: null,
   auto_inc: 0,
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
      $routes = [];
      $latest_route = null;
      for (var $r=0, $len=localStorage.length; $r<$len; $r++) {
         var $key = localStorage.key($r);
         if ($key.replace(/[0-9]/, '') === 'route' && $key !== 'route0') {
            var $route = localStorage[$key];
            if ($route !== 'null' && $route !== null) {
               $route = JSON.parse($route);
               var $html = '<p><a id="js-load' + $route.routeid
                  + '" class="js-load" href="#">' + $route.name + '</a>';
               if ($route.example*1 === 0) {
                  $html += ' <a id="js-del' + $route.routeid
                     + '" class="js-del" title="Delete" href="#">[Delete]</a>';
                  if ($latest_route === null || $route.edited > $latest_route.edited ) {
                     $latest_route = $route;
                  }
                  $html += '</p>';
                  $routes.unshift($html);
               } else {
                  $html += '</p>';
                  $routes.push($html);
               }
               if ($route.routeid > $map.auto_inc) {
                  $map.auto_inc = $route.routeid;
               }
            }
         }
      }
      localStorage.setItem('route0', JSON.stringify($latest_route));
      $('#js-routes').prepend($routes.join('\r\n'));
   },
   loadRoute: function($r) {
      $map.load_route = $r;
      var $route = localStorage['route' + $r];
      if ($route !== 'null' && $route !== null) {
         $route = JSON.parse($route);
         $map.points = google.maps.geometry.encoding.decodePath($route.route);
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
         $('#js-name').val($route.name);
         $('#js-unit').val(($route.unit*1 === 1) ? 'km' : 'miles');
         $('#js-progress').val(Math.round($route.progress * 100) / 100);
         $map.toggleMode(false);
         $map.redrawLine();
         $map.zoomFit();
         $map.route_id = $route.routeid;
         $map.drawingManager.setOptions({
            drawingMode: null
         });
      }
   },
   deleteRoute: function($r) {
      $map.del_route = $r;
      localStorage.removeItem('route' + $r);
      $('#js-del' + $map.del_route).parent().text('DELETED');
      $('#js-message').text('');
      $map.route_id = 0;
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
   deletePoint: function($vertex) {
      if ($vertex !== undefined) {
         $map.polyline.getPath().removeAt($vertex);
         $map.points = $map.polyline.getPath().getArray();
         if ($vertex === 0) {
            if ($map.points.length > 0) {
               $map.markers[0].setPosition($map.points[0]);
               if ($map.points.length === 1) {
                  $map.markers[1].setMap(null);
                  $map.markers.pop();
               }
            } else {
               $map.markers[0].setMap(null);
               $map.markers.pop();
            }
         } else if ($vertex === $map.points.length) {
            if ($map.points.length > 0) {
               if ($map.points.length === 1) {
                  $map.markers[1].setMap(null);
                  $map.markers.pop();
               } else {
                  $map.markers[1].setPosition($map.points[$map.points.length - 1]);
               }
            } else {
               $map.markers[1].setMap(null);
               $map.markers.pop();
            }
         }
         $map.redrawLine();
      }
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
      var $map_width = $('main').width();
      $('#map-canvas').css('width', Math.floor($map_width) + 'px');
      $('#map-canvas').css('height', Math.floor((3 * $map_width / 4)) + 'px');
      localStorage.setItem('route7', JSON.stringify({
         routeid: 7,
         route: 'cqn`Iv`y@yB~DU~@oGgAwEgAMk@Mw@E@GFFn@GVc@HoJbGwJvGqEjC}AX_AD}@CmI\\uYnAKv@CbK?hE@fED|AB|AFnAHnA^xBf@hCVnCJhAP`BTpAnB`FfA`C~@|Br@xBNd@Fb@O\\U`@oDn@uHhHmCjCb@~AJCCVdAjE`AxDx@Xb@{@hAsAAk@Gw@DaAvAkAh@w@n@Sp@hB^VVC`C_BfCkBZTPPvHgExAwA|@iATwARAFNZHXDdAc@TP\\S@DyA~@_@Vk@j@h@|CVnA^z@V^Pj@Ll@H^RCAYbAq@dAk@r@fCVpAlC_DyBcIgBiHqCfB?EnCiB|BwBH_@a@eD_@yC{AaHIk@CiAE}@Eg@Mk@Ik@Im@c@iD[kAc@k@c@Uk@D_ACg@Sc@}@MaA?oAb@aCZiCxBOfAAXHz@ClAo@nAi@tBiAT^XxB\\zD^tC^l@|AeAb@`@XpARZRl@lAg@PCXJtAaAf@[XG\\R|@lAT`@Jh@Bv@Cn@s@hED~BD|AE`BFx@Lf@|@e@nAw@t@c@f@yChBsIv@kE?_@OiCm@gGeA_FgCgLmB}I_@oB{@eHrCp@p@ZVbDHN|Av@JTD~@dCf@DXM`DI|CAnAGbE?jBAd@SjAp@|@R^`ApBHAj@oC~@wGb@oCl@}CP{@LqBd@uD`@qC\\gBPaCFeAHk@EYoA}@U_@Ii@KMgBb@cAbB',
         name: 'Deeping 10k',
         progress: 0,
         unit: 1,
         example: 1
      }));
      localStorage.setItem('route1', JSON.stringify({
         routeid: 1,
         route: '{hdyHmTkQyv@iF_NKeW_Mya@u@or@_D}SuEuA_C}L?al@kQ_UaKa]sCki@_DyJm_@dI^|SjBlEh@~ThCzKsBza@tNpd@~Hl[~D`e@jIbyAi@fg@j^xcB_E~E~BlE~B~oAuCtW_Q~c@kK~Mah@xeAaDsHyEeEu@`GyDtA{JGeH_FdF{RnL_CiAgJePsVwXfByGfC_EbOrBxYjE~Mz^pv@nBz@eBhGzEvaAyC~PgUln@k\\yR{KqCjC}L_Ee[_BczBqDo`@zAs@dBe[~Eu_@_C{Ou@aNdS|AnCtAnAcHpFwBtRtAjb@}AjCiCdJ?~KuIjNu^tCcLn@{OeKlBkNzCwr@yF_Cn_@kEf]kHnIcEGbEon@iGcA_Cl_@_CYxC}m@nAi@?uHoGmLuEgCHcDiA}EeAjDyAqCeIdIoIpCxAp~@eEvi@_CdNZpGq@lLi@fo@tInF~Dn\\Jhw@~AjfAuGbH~Gfo@i@fQhCzKuFlj@uEdm@Jn\\^|gA~E|b@dKfQnLrHv]xFkA|b@jDvy@eElEyBk@uDeM',
         name: 'London Marathon',
         progress: 0,
         unit: 0,
         example: 1
      }));
      localStorage.setItem('route2', JSON.stringify({
         routeid: 2,
         route: 'mcv_FncjhT~mAxtAz|@qGraCtcAlpB|gAf_B`bDbnA`]nZ`{@nnDdn@fgArlCbkD|i@ny@zrBvhCpGtr@_]fmBrcAtoC|pCxLnpAhlCdwBlfBhCp_BzrBjmBnpAjh@gjBr_Bha@daDucAlh@byAr`AhCrZl{B~iBcPjuAbyAfv@ka@sZ{pClh@ka@dcBxdGnsGiqEn{Bxv@tZk_Axy@lTz_F_mEbeD{K|fFoyC`yAl}AzmBePlsHrnBfkAiCzL|gAf^gCjIj_Ad^re@zLv_CzgAse@nv@~cClxBl}AzLrsFsh@rsF{bCzwFm}@nr@{tBliIhPb{@iPj_Ad^l{Bk}@hhC`l@|pCoBrsFuuA~cCg_Cxv@k}@~cCal@n`GkkEre@odIhqE{L|gAoh@|i@xLzwFtgAv_CblD`]ra@rjDw{Fnr@kv@jtJstBj_AwmBowDa~CcyA_kEsuE{dDbyAotBd~E}qAhqEtZ|sH{LflApa@ztAmBv_Cr`AxtAtfB`]|wBbwBhP|gAonAb{@~jAthEtsC?|EtcAae@taBhiChjB|ExrBptBja@sZ~eBoBhhCbkAppAoh@rlCnhDlbFwSbwBxfBnr@dkAdeIi}@`bDbkAd~E|_Bnr@h~CdaKzmBjhCoo@hhCpiCvfFx|Eha@hsDnyCua@dwBta@flAov@rjD}EtjDfaE~eBneDrjDz|Jw_CvZglAjrAor@jrAtcAlvEvX~pCw_CvaJpnBhcHnr@lnBvfFlnBztAqyAx~TurFjrKmgGxbHzzD|pCwhJn`Guo@zwFmoJb{@zSxtAepDxtAiWdwB{aIj}AgtC|pCua@jtJeyAvnCemCrViW`bDycF|i@zOnvF',
         name: 'Grand Canyon',
         progress: 0,
         unit: 0,
         example: 1
      }));
      localStorage.setItem('route3', JSON.stringify({
         routeid: 3,
         route: 'iy~{C{fafEsbJq|HwpDyiKodOpnBi_ZivIcjPv_C_rItbSxpJhvI`bCvpYy]lfg@isH`wM`oEjoFesHxiKoe@hvIqqVh}L_tGp|Hq{G`pJguRd~Ee{GqGkeFhoFhwDxbHc|RfhNywOrqGszGfhNcyHvX{tKn`Gw|[vpYo}W`iG?raMqvI|sHl~AdeIqiJngJugFpaMkxEnbFcrDbyAex@or@aRfjB}xLtdRcdM|pCcpJwXitL}uGu|I{tAwsE|pCqqKre@wh@fsD_yDflAosEpGgxRuhEoqOd|Fi|D~lEg|Ob`EwtS{KedKzrBecCssFwqTclLitHbwB}lV}nDmyCslCqdNuaB}gPakFk~JeuCu|E}~IgkJm{BssQ}|JwQe~Eoc`@}jQeqLflAscDsjDceNv_CydU_{K}pOpGu|F_mEgrIfuC_zMglA}Zv}CmuDj_AeyI}gAioEjmGanAps@{u@dBwv@ho@s^fo@sgCfQm`@dzA{a@zh@wi@r^bQjp@pUtm@xGlIvHqG',
         name: 'Nile Cruise',
         progress: 0,
         unit: 0,
         example: 1
      }));
      localStorage.setItem('route4', JSON.stringify({
         routeid: 4,
         route: 'yhieFtibjVzfJ_fBvkB~eBfcHka@ddEclLfdOidP|kBwtLneLgoQfoJcki@leRqcLpzUek^jyT_{K`_W_fBnxG`bDsSbiGfvFflAxaFtfFdePqGpbIivI~{V{aZna@suEfyDk}Ad}Km`RzyW{sSp{Bc~EzgMsuEdkAypNjpPq|HfvW{zV`kK_tHn}EytAvaEu_NvvEia@jjHwmIjfZglAvhL`bDh`IihCrsF{wFpwL{{D~|BdwB`qL_fBbdCn`GxvPvfFjnDewB~}Ie}WjeSqxUdcG_fBhzLor@~dNscL`tL{eMv`FqqRrkE_fB`wBfsDpkX~eB`iB|pC~}DpGleCuap@tzCmrKweAi`]neCogJpp@g`]pcUq{e@fzMc}b@jeMejwCzlS_wX',
         name: 'Route 101',
         progress: 0,
         unit: 0,
         example: 1
      }));
      localStorage.setItem('route5', JSON.stringify({
         routeid: 5,
         route: 'obxxEij|sY}Sp|Hr`BvmIurAjdEj_DfoQqnB~aO{ZpxUb~EbeI~ExbHl_D|pCyo@jyNwkAztAzh@jkHp|BldEwkAjdE~E|wFrnBfsDrcC{tAjeFd~EhqJ`lWz_Gf{A~Eja@lz@rcAls@uIv@~\\tmAwg@}ZnwDlhAdhBwGal@fn@naAl|CmEwfAe_@v\\?gRmE_~@c~E|mDcxGnWmhOr}HugKnpNrnB~bNnyCdsAdzGgoBjdPpxEljZj}BvmIn`Dnr@ndCx{D|mF~aOlbIha@h|FxpN|uD|pCnsAnyC|{HnyClfJp|H|}BvfFqeArqGvaBr|HwhBrtWvhBdvTe[n|SwaBjnXcwMvbSfi@hkSmeAngJcvDjyNatJnnMevMx{Dci@jhCf~@jkH{xEdeI~EzsSc~b@ldE`TtmIkeHbbDalApjOckCfzGaaBlq]aqEpjO`xEvpYdiGzwFtn[|i@t_Fn`Gj}BvdGr^b`EzdBx{DpIldEx}AjfDqW|pCryCrlCnIb~E|jE|nD~kBn`Gu^lbFirDjhCvs@l{BnoBdwBpoBx{D`F`bDs~IzK',
         name: 'Tokyo to Kyoto',
         progress: 0,
         unit: 0,
         example: 1
      }));
      localStorage.setItem('route6', JSON.stringify({
         routeid: 6,
         route: '{_xiGg_sk@kyPmbt@hgCesOsrJcsOtuAogJ_cGceIlnBelLigTswg@sjPdP}uKouPeiUikSsWogJeyQywQa}Rwvn@hKev_@j~C}sHx{Ey}q@j{O}yh@bfHyae@gp@ypNrrHi`]fbVojZ|eT}yh@zyf@yl[~a\\ia@znWnyCpeUig`@fpb@yiKf|KnyCx_QihCfuNu{ZqKwok@x}Kyl[roOytAjq@o`Gt|^ka@dhXclLzfMi}L~jAcdf@dv^iqs@d~e@ouPfe@ywQhiW}nr@tqHsia@okEczR',
         name: 'Nice to Rome',
         progress: 0,
         unit: 0,
         example: 1
      }));
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
         center: { lat: 0, lng: 0 },
         zoom: 1
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
      google.maps.event.addDomListener(document.getElementById('js-delete'), 'click', function() {
         if ($map.polyline.getEditable()) {
            $map.deletePoint($map.points.length - 1);
         }
      });
      google.maps.event.addDomListener(document.getElementById('js-clear'), 'click', function() {
         if ($map.polyline.getEditable()) {
            if (confirm('Clear the whole route?')) {
               $map.clearMarkers();
               $map.points = [];
               $map.redrawLine();
            }
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
         if ($map.route_id === 0) {
            $map.route_id = ++$map.auto_inc;
         }
         localStorage.setItem('route' + $map.route_id, JSON.stringify({
            routeid: $map.route_id,
            route: google.maps.geometry.encoding.encodePath($map.points),
            name: $('#js-name').val(),
            progress: $('#js-progress').val(),
            unit: ($('#js-unit').val() === 'km') ? 1 : 0,
            edited: Date.now(),
            example: 0
         }));
      });
      google.maps.event.addDomListener(document.getElementById('js-view'), 'click', function() {
         $map.redrawProgress();
      });
      google.maps.event.addDomListener(document.getElementById('js-edit'), 'click', function() {
         $map.toggleMode(!$map.polyline.getEditable());
      });
      google.maps.event.addDomListener($map.polyline, 'dblclick', function($mev){
         $map.deletePoint($mev.vertex);
      });
      google.maps.event.addDomListener(document.getElementById('js-unit'), 'change', function() {
         $map.redrawLine();
      });
      $('#js-new').click(function() {
         $map.route_id = 0;
         $('#js-name').val('');
      });
      $map.loadRoutes();
      $map.loadRoute(0);
   }
}
$map.init();
google.maps.event.addDomListener(window, 'load', $map.googleInit());