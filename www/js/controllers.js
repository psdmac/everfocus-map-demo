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


.controller('MapCtrl', ['$scope', '$state', '$stateParams', '$ionicBackdrop', '$ionicPopup', '$ionicModal', '$ionicHistory', '$location', '$timeout', 'Info', function($scope, $state, $stateParams, $ionicBackdrop, $ionicPopup, $ionicModal, $ionicHistory, $location, $timeout, Info){
  console.log(Info.carType, Info.driveType);
  var getAddress;

  app.setCurrentLocation = function(coords) {
    map.panTo(new google.maps.LatLng(coords.latitude, coords.longitude));
    var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
    Info.startGeo.lat = coords.latitude;
    Info.startGeo.lng = coords.longitude;
    geocoder.geocode({'latLng': latlng}, function(results, status) {
      if (status == google.maps.GeocoderStatus.OK) {
        if (results[0]) {
          Info.startAddress = results[0].formatted_address;
          $('#fix-footer .start').text(results[0].formatted_address);
          // $('input[name=start]').val(results[0].formatted_address);
          $scope.getNear(coords.latitude, coords.longitude);
          $scope.interval();
          $scope.$apply();
        }
      } else {
        // alert("Geocoder failed due to: " + status);
      }
    });
  }

  // if (!Info.carType || !Info.driveType) {
  //   $state.go('app.towingstep1');
  //   return;
  // }
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
    var firstTime = true;
    google.maps.event.addListener(map, 'dragend', function() {
      // console.log('center_changed');
      if (firstTime) {
        $scope.isCenter = true;
        $scope.$apply();
        firstTime = false;
      } else {
        $scope.isCenter = false;
        $scope.$apply();
      }
      $('#fix-footer .start').text('');
      if (getAddress) {
        $timeout.cancel(getAddress);
      }
      getAddress = $timeout(function() {
        var coords = map.getCenter();
        console.log('...corrds:'+ coords);
        var latlng = new google.maps.LatLng(coords.H, coords.L);
        Info.startGeo.lat = coords.H;
        Info.startGeo.lng = coords.L;
        geocoder.geocode({'latLng': latlng}, function(results, status) {
          if (status == google.maps.GeocoderStatus.OK) {
            if (results[0]) {
              Info.startAddress = results[0].formatted_address;
              $('#fix-footer .start').text(results[0].formatted_address);
            }
          } else {
            // alert("Geocoder failed due to: " + status);
          }
        });
        $scope.getNear(coords.H, coords.L);
        $scope.$apply();
      }, 100);
    });
  }, 0);

  $scope.info = '';

  $scope.getNear = function(lat, lng) {
    var point = new Parse.GeoPoint({latitude: lat, longitude: lng});
    var Device = Parse.Object.extend("Device");
    var queryNear = new Parse.Query(Device);
    queryNear.near("location", point);
    queryNear.withinKilometers("location", point, 6);
    // queryNear.limit(10);
    queryNear.find({
      success: function(objs) {
        // console.log(objs);
        $scope.setMarkerOnMap(objs);
        if (objs.length == 0) {
          $scope.info = '半徑 6 公里內無拖車';
        } else {
          $scope.info = '設定起運地點';
          var endPoint = objs[0].attributes;
          var request = {
            origin: new google.maps.LatLng(lat, lng),
            destination: new google.maps.LatLng(endPoint.lat, endPoint.lng),
            travelMode: google.maps.TravelMode.DRIVING
          }
          directionsService.route(request, function(result, status) {          
            if (status == google.maps.DirectionsStatus.OK) {
              // console.log(result);
              console.log(result.routes[0].legs[0].duration.text);
              $scope.deliverTime = result.routes[0].legs[0].duration.text;
              $scope.$apply();
            } else {
              console.log('no result...');
            }
          });
        }
        $scope.$apply();
      }
    });
  }

  $scope.getCenter = function() {
    $ionicBackdrop.retain();
    app.watchId = fgGeo.getCurrentPosition(function(location) {
      var coords = location.coords;
      map.panTo(new google.maps.LatLng(coords.latitude, coords.longitude));
      var latlng = new google.maps.LatLng(coords.latitude, coords.longitude);
      Info.startGeo.lat = coords.latitude;
      Info.startGeo.lng = coords.longitude;
      geocoder.geocode({'latLng': latlng}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (results[0]) {
            Info.startAddress = results[0].formatted_address;
            $('#fix-footer .start').text(results[0].formatted_address);
            $scope.isCenter = true;
            $ionicBackdrop.release();
            $scope.getNear(coords.latitude, coords.longitude);
            $scope.$apply();
          }
        } else {
          // alert("Geocoder failed due to: " + status);
        }
      });

    }, function() {
      $ionicBackdrop.release();
    }, {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    });
  }

  $scope.isCenter = false;

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

.controller('TowingCtrl', ['$state','$stateParams','$scope', '$timeout', '$location', '$ionicPopup','$ionicBackdrop', 'Info', function($state, $stateParams, $scope, $timeout, $location, $ionicPopup, $ionicBackdrop, Info){
  var carType,driveType;
  $scope.next = function() {

    carType = $('input[name="car-type"]:checked').val();
    driveType = $('input[name="drive-type"]:checked').val();
    console.log(carType, driveType);

    if (!carType) {
      $ionicPopup.alert({
        title: '資料不全',
        template: '尚未填寫車輛形式'
      });
      return;
    } else if (!driveType) {
      $ionicPopup.alert({
        title: '資料不全',
        template: '尚未填寫傳動方式'
      });
      return;
    }
    $scope.action();
  }
  $scope.action = function() {
    $ionicBackdrop.retain();
    Info.carType = carType;
    Info.driveType = driveType;
    $timeout(function() {
      $ionicBackdrop.release();
    }, 0);
    $timeout(function() {
      $state.go('app.search');
    }, 0);
  };
}])

.controller('LoadCtrl', ['$scope','$state', function($scope, $state){
  var currentUser = Parse.User.current();
  if (currentUser) {
    $state.go('app.service');
  } else {
    $state.go('init');
  }
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

.controller('InitCtrl', ['$scope', '$location', '$ionicModal', '$timeout', '$ionicBackdrop', '$ionicPopup', function($scope, $location, $ionicModal, $timeout, $ionicBackdrop, $ionicPopup) {


  // Form data for the login modal
  $scope.loginData = {};
  $scope.signupData = {};

  // Create the login modal that we will use later
  $ionicModal.fromTemplateUrl('templates/login.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.loginModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeLogin = function() {
    $scope.loginModal.hide();
  };

  // Open the login modal
  $scope.login = function() {
    $scope.loginModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doLogin = function() {
    if (!$scope.loginData.username || !$scope.loginData.password) {
      $ionicPopup.alert({
        title: '資料不全',
        template: '請填寫帳號密碼'
      });
      return;
    } else if ($scope.loginData.username.length != 10) {
      $ionicPopup.alert({
        title: '資料不全',
        template: '手機號碼格式不符'
      });
      return;
    } else if ($scope.loginData.password.length < 6) {
      $ionicPopup.alert({
        title: '密碼錯誤',
        template: '密碼需大於 6 碼'
      });
      return;
    } else if ($scope.loginData.password.length > 15) {
      $ionicPopup.alert({
        title: '密碼錯誤',
        template: '密碼需小於 15 碼'
      });
      return;
    }


    $ionicBackdrop.retain();
    Parse.User.logIn($scope.loginData.username, $scope.loginData.password, {
      success: function(user) {
        console.log(user);
        $ionicBackdrop.release();
        $scope.closeLogin();
        $location.path('/app/service');
      },
      error: function(user, error) {
        $ionicPopup.alert({
          title: '登入錯誤',
          template: error
        });
        $ionicBackdrop.release();
      }
    });

    // $timeout(function() {
    //   $scope.closeLogin();
    //   $location.path('/app/service');
    // }, 1000);
  };

  $ionicModal.fromTemplateUrl('templates/signup.html', {
    scope: $scope
  }).then(function(modal) {
    $scope.signupModal = modal;
  });

  // Triggered in the login modal to close it
  $scope.closeSignup = function() {
    $scope.signupModal.hide();
  };

  // Open the login modal
  $scope.signup = function() {
    $scope.signupModal.show();
  };

  // Perform the login action when the user submits the login form
  $scope.doSignup = function() {
    if (!$scope.signupData.username || !$scope.signupData.password || !$scope.signupData.email) {
      $ionicPopup.alert({
        title: '資料不全',
        template: '資料需填寫完整'
      });
      return;
    } else if ($scope.signupData.username.length != 10 || !$scope.signupData.username) {
      $ionicPopup.alert({
        title: '資料不全',
        template: '手機號碼格式不符'
      });
      return;
    } else if (!validateEmail($scope.signupData.email)) {
      $ionicPopup.alert({
        title: '資料不全',
        template: 'email 格式不符'
      });
      return;
    } else if ($scope.signupData.password.length < 6) {
      $ionicPopup.alert({
        title: '密碼錯誤',
        template: '密碼需大於 6 碼'
      });
      return;
    } else if ($scope.signupData.password.length > 15) {
      $ionicPopup.alert({
        title: '密碼錯誤',
        template: '密碼需小於 15 碼'
      });
      return;
    }

    $ionicBackdrop.retain();
    var user = new Parse.User();
    user.set("username", $scope.signupData.username);
    user.set("password", $scope.signupData.password);
    user.set("email", $scope.signupData.email);
    user.signUp(null, {
      success: function(user) {
        $ionicBackdrop.release();
        $scope.closeSignup();
      },
      error: function(user, error) {
        $ionicPopup.alert({
          title: '錯誤',
          template: error.message
        });
        $ionicBackdrop.release();
        return;
      }
    });
  };
}])

.controller('GasCtrl', ['$scope', '$location', '$ionicModal', '$timeout', function($scope, $location, $ionicModal, $timeout) {

}])

.controller('AppCtrl', ['$scope', '$location', '$ionicModal', '$timeout', function($scope, $location, $ionicModal, $timeout) {
  $scope.logout = function() {
    Parse.User.logOut();
    console.log(Parse.User.current());
    $location.path('/home')
  }
}])

.controller('PlaylistsCtrl', function($scope) {
  $scope.playlists = [
    { title: 'Reggae', id: 1 },
    { title: 'Chill', id: 2 },
    { title: 'Dubstep', id: 3 },
    { title: 'Indie', id: 4 },
    { title: 'Rap', id: 5 },
    { title: 'Cowbell', id: 6 }
  ];
})

.controller('PlaylistCtrl', function($scope, $stateParams) {
});
