var app = {};
var fgGeo,
    geocoder,
    directionsService,
    directionsDisplay;

var map;
var calcMap;
function initialize() {
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
    center: new google.maps.LatLng(25.0493098, 121.54648),
    zoom: 13,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
  geocoder = new google.maps.Geocoder();
  directionsService = new google.maps.DirectionsService();
  directionsDisplay = new google.maps.DirectionsRenderer();
}

// Ionic Starter App
Parse.initialize("dgCqs2hJo3iXzaxEDUpAjfhtBy8zOdAICIx1nF5k", "TYQ6wAX3dd5P4e5jXakIUbmZMxz48DPeylk21ALP");
// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'validation', 'validation.rule','ngCordova'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  .state('app', {
    url: "/app",
    abstract: true,
    templateUrl: "templates/menu.html",
    controller: 'AppCtrl'
  })

  .state('loading', {
    url: "/loading",
    templateUrl: "templates/loading.html",
    controller: "LoadCtrl",
    cache: false
  })

  .state('init', {
    url: "/home",
    templateUrl: "templates/home.html",
    controller: 'InitCtrl'
  })

  .state('app.service', {
    url: "/service",
    views: {
      'menuContent': {
        templateUrl: "templates/service.html",
        controller: "ServiceCtrl"
      }
    }
  })

  .state('app.towingstep1', {
    url: "/step1",
    views: {
      'menuContent': {
        templateUrl: "templates/step1.html",
        controller: 'TowingCtrl'
      }
    }
  })

  .state('app.order', {
    url: "/order",
    views: {
      'menuContent': {
        templateUrl: "templates/order.html",
        controller: "OrderCtrl"
      }
    },
    cache: false
  })

  .state('app.search', {
    url: "/search",
    views: {
      'menuContent': {
        templateUrl: "templates/search.html",
        controller: 'MapCtrl'
      }
    },
    cache: false
  })

  .state('app.gas', {
    url: "/gas-station",
    views: {
      'menuContent': {
        templateUrl: "templates/gas.html",
        controller: 'GasCtrl'
      }
    },
    cache: false
  })

  .state('app.browse', {
    url: "/browse",
    views: {
      'menuContent': {
        templateUrl: "templates/browse.html"
      }
    }
  })
  .state('app.playlists', {
    url: "/playlists",
    views: {
      'menuContent': {
        templateUrl: "templates/playlists.html",
        controller: 'PlaylistsCtrl'
      }
    }
  })
  .state('app.single', {
    url: "/playlists/:playlistId",
    views: {
      'menuContent': {
        templateUrl: "templates/playlist.html",
        controller: 'PlaylistCtrl'
      }
    }
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/loading');
});
