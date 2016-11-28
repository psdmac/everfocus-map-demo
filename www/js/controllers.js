function validateEmail(email) {
  var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return re.test(email);
}


angular.module('starter.controllers', [])

.directive('underBtn', [function(){
  // Runs during compile
  return {
    restrict: 'A', // E = Element, A = Attribute, C = Class, M = Comment
    // template: '',
    // templateUrl: '',
    // replace: true,
    // transclude: true,
    // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
    link: function($scope, iElm, iAttrs) {
      var elmHeight = iElm[0].offsetHeight,
          totalHeight = angular.element(window)[0].innerHeight;
      $(iElm).css('paddingTop', totalHeight - elmHeight - 20);
    }
  };
}])


.controller('MapCtrl', ['$scope', '$state', '$stateParams', '$http', '$ionicBackdrop', '$ionicPopup', '$ionicModal', '$ionicHistory', '$location', '$timeout', 'Info', function($scope, $state, $stateParams, $http, $ionicBackdrop, $ionicPopup, $ionicModal, $ionicHistory, $location, $timeout, Info){
  var getAddress;

  $scope.selectInfo = {};

  $scope.isCenter = false;

  $scope.timeago = function(time) {
    time = parseInt(time, 10) *1000;
    var offsetTime = new Date().getTime() - time;
    return moment(offsetTime).startOf('hour').fromNow();
  }

  $scope.getCarList = function() {
    $http({
      method: 'GET',
      url: 'https://carbus.com.tw/car/getcar'
    }).then(function(res) {
      $scope.carLists = res.data.data;
      console.log($scope.carLists);
      angular.forEach($scope.carLists, function(car) {
        car.defaultBeginTime =  new Date( ( parseInt(car.server_time) - parseInt(car.seconds) )*1000 - 1800*1000 );
        car.defaultEndTime =  new Date( ( parseInt(car.server_time) - parseInt(car.seconds) )*1000 );
      })
    })
  }

  $scope.getCarList();

  $ionicModal.fromTemplateUrl('templates/select.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.selectModal = modal;
  });
  $scope.selectCar = function() {
    $scope.selectModal.show();
  }
  $scope.closeSelect = function() {
    $scope.selectModal.hide();
  }

  $ionicModal.fromTemplateUrl('templates/imei.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.imeiModal = modal;
  });

  $scope.getIMEI = function(e) {
    e.preventDefault();
    $scope.imeiModal.show();
  }
  $scope.closeIMEI = function() {
    $scope.selectInfo.imei = undefined;
    $scope.imeiModal.hide();
  }
  $scope.setIMEI = function(imei) {
    $scope.setTime(imei);
    $scope.imeiModal.hide();
  }
  $scope.setTime = function(imei) {
    angular.forEach($scope.carLists, function(car) {
      if (car.imei == imei) {
        $scope.selectInfo.startDateTime = car.defaultBeginTime;
        $scope.selectInfo.endDateTime = car.defaultEndTime;
      }
    });
  }

  $scope.getHistory = function(data) {
    $scope.isSnapped = false;
    $ionicBackdrop.retain();
    var begin = Math.floor( (new Date(data.startDateTime).getTime())/1000 );
    var end = Math.floor( (new Date(data.endDateTime).getTime())/1000 );
    var imei = data.imei;
    $http({
      method: 'GET',
      url: 'https://carbus.com.tw/car/history?time='+begin+'&begin='+begin+'&end='+end+'&imei='+imei
    }).then(function(res) {
      if (res.data.data.length < 1000) {
        $scope.routeHistory = res.data.data;
        console.log($scope.routeHistory);
        $ionicBackdrop.release();
        $scope.drawRoute($scope.routeHistory);
      } else {
        $scope.routeHistory = res.data.data;
        $scope.fetchMore(res.data.data[999].gps_time, begin, end, imei);
      }
    })
  }

  $scope.fetchMore = function(time, begin, end, imei) {
    $http({
      method: 'GET',
      url: 'https://carbus.com.tw/car/history?time='+time+'&begin='+time+'&end='+end+'&imei='+imei
    }).then(function(res) {
      if (res.data.data.length < 1000) {
        angular.forEach(res.data.data, function(value) {
          $scope.routeHistory.push(value);
        });
        console.log($scope.routeHistory);
        $ionicBackdrop.release();
        $scope.drawRoute($scope.routeHistory);
      } else {
        angular.forEach(res.data.data, function(value) {
          $scope.routeHistory.push(value);
        });
        $scope.fetchMore(res.data.data[999].gps_time, begin, end, imei);
      }
    })
  }

  var drivePath;
  var snappedPath;

  $scope.drawRoute = function(points) {
    $scope.getSnapPath(points);
    $scope.closeSelect();
    if (drivePath) {
      drivePath.setMap(null);
    }
    var path = [];
    angular.forEach(points, function(point) {
      path.push({
        lat: point.lat,
        lng: point.lng
      });
    });
    drivePath = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#918ec8',
      strokeOpacity: 1.0,
      strokeWeight: 4
    });
    map.panTo(path[0]);
    drivePath.setMap(map);
  }

  $scope.isSnapped = false;
  $scope.getSnapPath = function(points) {
    var path = "";
    if (points.path < 100) {
      angular.forEach(points, function(point) {
        if (point === points[points.length - 1]) {
          path = path + point.lat.toString() +','+ point.lng.toString();
        } else {
          path = path + point.lat.toString() +','+ point.lng.toString() + '|';
        }
      });
    } else {
      var offset = Math.floor(points.length/100);
      console.log('offset', offset);
      for (var i = 0; i < 100; i++) {
        if (i == 99) {
          path = path + points[offset*i].lat.toString() +','+ points[offset*i].lng.toString();
        } else {
          path = path + points[offset*i].lat.toString() +','+ points[offset*i].lng.toString() + '|';
        }
      }
    }
    $http({
      method: 'GET',
      url: 'https://roads.googleapis.com/v1/snapToRoads?path='+ path +'&interpolate=true&key=AIzaSyBK1UdPeQoFK1cqoS_smoW3FoRbHOldERE'
    }).then(function(res) {
      console.log(res.data.snappedPoints);
      $scope.drawSnapped(res.data.snappedPoints);
    })
  }

  $scope.drawSnapped = function(points) {
    var path = [];
    angular.forEach(points, function(point) {
      path.push({
        lat: point.location.latitude,
        lng: point.location.longitude
      });
    });
    if (snappedPath) {
      snappedPath.setMap(null);
    }
    snappedPath = new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#000000',
      strokeOpacity: 1.0,
      strokeWeight: 2
    });
    map.panTo(path[0]);
    $scope.isSnapped = true;
  }


  $scope.$watch('showSnapped', function(newValue, oldValue) {
    console.log('newValue', newValue);
    console.log('oldValue', oldValue);
    if (newValue) {
      if (snappedPath) {
        snappedPath.setMap(map);
      }
    } else {
      if (snappedPath) {
        snappedPath.setMap(null);
      }
    }
  }, true);

  app.setCurrentLocation = function(coords) {
    map.panTo(new google.maps.LatLng(coords.latitude, coords.longitude));
    var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
    Info.startGeo.lat = coords.latitude;
    Info.startGeo.lng = coords.longitude;
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          console.log(results[0].formatted_address);
        }
      } else {
        // alert("Geocoder failed due to: " + status);
      }
    });
  }

  $timeout(function() {
    initialize();
    fgGeo = window.navigator.geolocation;
    app.watchId = fgGeo.getCurrentPosition(function(location) {
      app.setCurrentLocation(location.coords);
    }, function() {
      console.log('error');
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    });
  }, 0);


  $scope.getCenter = function() {
    $ionicBackdrop.retain();
    app.watchId = fgGeo.getCurrentPosition(function(location) {
      var coords = location.coords;
      map.panTo(new google.maps.LatLng(coords.latitude, coords.longitude));
      $ionicBackdrop.release();
    }, function() {
      $ionicBackdrop.release();
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    });
  }



  $scope.markersArray = []
  $scope.setMarkerOnMap = function(res) {
    $scope.deleteOverlays();
    var data = [];
    angular.forEach(res, function(val) {

      var course = val.attributes.course;
      var icon = '';
      if (course <= 45 || course > 315) {
        icon = 'img/gray_north_21.gif';
      } else if (course > 45 || course <= 135) {
        icon = 'img/gray_east_21.gif';
      } else if (course > 135 || course <= 225 ) {
        icon = 'img/gray_south_21.gif';
      } else if (course > 225 || course <= 315) {
        icon = 'img/gray_west_21.gif';
      }
      var marker =  new google.maps.Marker({
        position: new google.maps.LatLng(val.attributes.lat, val.attributes.lng),
        map: map,
        icon: icon
      });
      $scope.markersArray.push(marker);
    });
    $scope.showOverlays($scope.markersArray);
  }
  $scope.showOverlays = function() {
    if ($scope.markersArray) {
      for (i in $scope.markersArray) {
        $scope.markersArray[i].setMap(map);
      }
    }
  }
  $scope.deleteOverlays = function() {
    if ($scope.markersArray) {
      for (i in $scope.markersArray) {
        $scope.markersArray[i].setMap(null);
      }
      $scope.markersArray.length = 0;
    }
  }
  $scope.interval = function() {
    $timeout(function() {
      var coords = map.getCenter();
      console.log(coords);
      $scope.getNear(coords.H, coords.L);
      $scope.interval();
      console.log('refresh...');
    }, 10000);
  }

  $scope.findAddress = function(address) {
    console.log(address);
    var address = { 'address': address };
    geocoder.geocode( address, function(results, status) {
      console.log(results);
      var result = [];
      if (status == google.maps.GeocoderStatus.OK) {
        results.forEach(function(value) {
          value.address_components.forEach(function(val) {
            if (val.short_name == 'TW') {
              result.push(value);
            }
          })
        });
        if (result.length==0) {
          $scope.addressErr();
        } else {
          var endAddress = result[0].formatted_address;
          console.log(endAddress);
          Info.endAddress = endAddress;
          $scope.calc();
        }
      } else {
        $scope.addressErr();
      }
      $scope.$apply();
    });
  }

  $scope.addressErr = function() {
    $ionicPopup.alert({
      title: '錯誤',
      template: '您輸入的地址可能有誤'
    });
    return;  
  }

  $ionicModal.fromTemplateUrl('templates/calc.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.calcModal = modal;
  });

  $scope.closeCalc = function() {
    $scope.calcModal.hide();
  };

  $scope.calc = function() {
    $scope.calcModal.show();
    var mapOptions = {
      scrollwheel: false,
      navigationControl: false,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: false,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      center: new google.maps.LatLng(Info.startGeo.lat, Info.startGeo.lng),
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    calcMap = new google.maps.Map(document.getElementById('calc-map'), mapOptions);
    directionsDisplay.setMap(calcMap);
    $scope.startAddress = Info.startAddress;
    $scope.endAddress = Info.endAddress;

    var loading = $('#calc .content .loading');
    var request = {
      origin: Info.startAddress,
      destination: Info.endAddress,
      travelMode: google.maps.TravelMode.DRIVING
    }
    directionsService.route(request, function(result, status) {          
      if (status == google.maps.DirectionsStatus.OK) {
        console.log(result);
        directionsDisplay.setDirections(result);
        $scope.directionResult = result;
        $scope.distance = result.routes[0].legs[0].distance.text;
        $scope.distanceValue = result.routes[0].legs[0].distance.value;
        if(result.routes[0].legs[0].distance.value <= 6000) {
          $scope.distancePrice = 500;
        } else {
          var moreDistance = Math.ceil((result.routes[0].legs[0].distance.value - 6000)/1000);
          var price = 500 + 50 * moreDistance;
          $scope.distancePrice = price;
        }
        var d = new Date();
        if (d.getHours() > 17 || d.getHours() < 9) {
          $scope.nightPlusPrice = 500;
          $scope.nightPrice = true;
        } else {
          $scope.nightPlusPrice = 0;
          $scope.nightPrice = false;
        }
        $scope.totalPrice = $scope.distancePrice;
        $scope.$apply();
      } else {

      }
    });
  };
  $scope.ask = function() {
    $ionicHistory.nextViewOptions({
      disableBack: true
    });
    $ionicBackdrop.retain();
    var currentUser = Parse.User.current();
    var history = Parse.Object.extend("History");
    var historyObj = new history();
    historyObj.set('result', $scope.directionResult);
    historyObj.set('status', '等待派車中');
    historyObj.save(null, {
      success: function(obj) {
        var relation = currentUser.relation("order");
        relation.add(obj);
        currentUser.save();
        $scope.closeCalc();
        $ionicBackdrop.release();
        $state.go('app.order');
        $scope.$apply();
      }
    })
  }
}])

.controller('OrderCtrl', ['$scope','$timeout','$ionicHistory','$ionicModal','$ionicPopup', function($scope, $timeout, $ionicHistory, $ionicModal, $ionicPopup){
  console.log('order...');
  var currentUser = Parse.User.current();
  var relation = currentUser.relation("order");
  relation.query().find({
    success: function(list) {
      angular.forEach(list, function(obj) {
        console.log(obj);
        var overview_polyline = obj.attributes.result.routes[0].overview_polyline;
        obj.map = 'https://maps.googleapis.com/maps/api/staticmap?size=400x280&path=weight:8%7Ccolor:45ADD1%7Cenc:'+ overview_polyline;
      });
      $scope.orders = list;
      $scope.$apply();
    }
  });

  $ionicModal.fromTemplateUrl('templates/realtime.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.trackerModal = modal;
  });

  $scope.tracking = function(imei, result) {
    directionsService = new google.maps.DirectionsService();
    $scope.imei = imei;
    $scope.result = result;
    console.log(result.routes[0].legs[0].start_location);
    var startPoint = result.routes[0].legs[0].start_location;
    var endPoint = result.routes[0].legs[0].end_location
    console.log(imei);
    $scope.trackerModal.show();
    var mapOptions = {
      scrollwheel: false,
      navigationControl: false,
      mapTypeControl: false,
      disableDefaultUI: true,
      zoomControl: false,
      zoomControlOptions: {
        style: google.maps.ZoomControlStyle.LARGE,
        position: google.maps.ControlPosition.RIGHT_BOTTOM
      },
      center: new google.maps.LatLng(startPoint.A, startPoint.F),
      zoom: 13,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    trackerMap = new google.maps.Map(document.getElementById('tracker-map'), mapOptions);
    var startIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=A|63B62A|000000',
        endIcon = 'https://chart.googleapis.com/chart?chst=d_map_pin_letter&chld=B|F23B38|000000';
    var startMarker = new google.maps.Marker({
      position: new google.maps.LatLng(startPoint.A, startPoint.F),
      map: trackerMap,
      icon: startIcon
    });
    var endMarker = new google.maps.Marker({
      position: new google.maps.LatLng(endPoint.A, endPoint.F),
      map: trackerMap,
      icon: endIcon
    });
    startMarker.setMap(trackerMap);
    endMarker.setMap(trackerMap);

    $scope.getDeliverTime(result);
    $scope.interval();
    // $timeout(function() {
    //   $scope.distanceText = '0.1 公里';
    //   $scope.deliverTime = '1 分';
    // }, 3000)
    // $timeout(function() {
    //   $ionicPopup.alert({
    //     title: '通知',
    //     template: '車輛即將送達終點'
    //   });
    //   return;
    // }, 7000);
  }

  $scope.interval = function() {
    $timeout(function() {
      $scope.getDeliverTime($scope.result);
      $scope.interval();
    }, 10000);
  }

  $scope.getDeliverTime = function(result) {
    var startPoint = result.routes[0].legs[0].start_location;

    var Device = Parse.Object.extend("Device");
    var query = new Parse.Query(Device);
    query.equalTo("imei", $scope.imei);
    query.first({
      success: function(obj) {
        console.log(obj.attributes.course);
        // console.log(obj.attributes.lng);
        $scope.setCarMarker(obj);
        var request = {
          origin: new google.maps.LatLng(obj.attributes.lat, obj.attributes.lng),
          destination: new google.maps.LatLng(startPoint.A, startPoint.F),
          travelMode: google.maps.TravelMode.DRIVING
        }
        directionsService.route(request, function(result, status) {          
          if (status == google.maps.DirectionsStatus.OK) {
            console.log(result);
            console.log(result.routes[0].legs[0]);
            $scope.distanceText = result.routes[0].legs[0].distance.text;
            $scope.deliverTime = result.routes[0].legs[0].duration.text;
            $scope.$apply();
          } else {
            console.log('no result...');
          }
        });
      }
    });

  }

  $scope.setCarMarker = function(val) {
    var carMarker;
    if (carMarker) {
      carMarker.setMap(null);
    }
    var course = val.attributes.course;
    var icon = '';
    if (course <= 45 || course > 315) {
      icon = 'img/gray_north_21.gif';
    } else if (course > 45 || course <= 135) {
      icon = 'img/gray_east_21.gif';
    } else if (course > 135 || course <= 225 ) {
      icon = 'img/gray_south_21.gif';
    } else if (course > 225 || course <= 315) {
      icon = 'img/gray_west_21.gif';
    }
    carMarker =  new google.maps.Marker({
      position: new google.maps.LatLng(val.attributes.lat, val.attributes.lng),
      map: trackerMap,
      icon: icon
    });
    carMarker.setMap(trackerMap)
  }

  $scope.closeTracker = function() {
    $scope.trackerModal.hide();
  }



}])

.factory('Info', ['$http', function($http) {
  var carInfo = {
    carType: undefined,
    driveType: undefined,
    startAddress : '',
    endAddress: '',
    startGeo: {
      lat: undefined,
      lng: undefined
    },
    endGeo: {
      lat: undefined,
      lng: undefined
    }
  }
  return carInfo;
}])

.controller('LoadCtrl', ['$scope','$state', function($scope, $state){
  $state.go('app.service');
}])

.controller('ServiceCtrl', ['$scope','$state', function($scope, $state){
  $("#owl-demo").owlCarousel({
    slideSpeed : 300,
    rewindSpeed : 1000,
    paginationSpeed : 400,
    singleItem: true,
    autoPlay : true,
    rewindNav : true,
    responsive: true,
    responsiveRefreshRate : 200,
    responsiveBaseWidth: window
  });
}])

.controller('GasCtrl', ['$scope', '$location', '$ionicModal', '$timeout', function($scope, $location, $ionicModal, $timeout) {

}])

.controller('AppCtrl', ['$scope', '$location', '$ionicModal', '$timeout', function($scope, $location, $ionicModal, $timeout) {

}]);
