function validateEmail(email) {
  var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
  return re.test(email);
}


app.setCurrentLocation = function(coords) {
  map.panTo(new google.maps.LatLng(coords.latitude, coords.longitude));
}


var AppCtrl = angular.module('starter.controllers', [])

AppCtrl.directive('underBtn', [function(){
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
}]);


AppCtrl.controller('MapCtrl', ['$scope', '$state', '$stateParams', '$http', '$ionicBackdrop', '$ionicPopup', '$ionicModal', '$ionicHistory', '$location', '$timeout', 'Info', function($scope, $state, $stateParams, $http, $ionicBackdrop, $ionicPopup, $ionicModal, $ionicHistory, $location, $timeout, Info){
  var getAddress;

  console.log('MapCtrl...');

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
  }, 100);


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


}]);

AppCtrl.controller('KalmanCtrl', ['$scope', '$state', '$stateParams', '$http', '$ionicBackdrop', '$ionicPopup', '$ionicModal', '$ionicHistory', '$location', '$timeout', 'Info', function($scope, $state, $stateParams, $http, $ionicBackdrop, $ionicPopup, $ionicModal, $ionicHistory, $location, $timeout, Info) {

}]);

AppCtrl.factory('Info', ['$http', function($http) {
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
}]);

AppCtrl.controller('LoadCtrl', ['$scope','$state', function($scope, $state){
  $state.go('app.service');
}]);

AppCtrl.controller('ServiceCtrl', ['$scope','$state', function($scope, $state){
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
}]);


AppCtrl.controller('AppCtrl', ['$scope', '$location', '$ionicModal', '$timeout', function($scope, $location, $ionicModal, $timeout) {

}]);
