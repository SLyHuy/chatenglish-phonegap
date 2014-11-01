var Config = {
	fbAppId: '1449890398617312', //main app
	//fbAppId: '1464073817198970', // app test
	urlWebSocket: 'wss://swind.vn:9300',
	//urlWebSocket: 'ws://127.0.0.1:9300'
	//urlWebSocket: 'ws://192.168.1.101:9300/'
};

var ChatApp = angular.module('ChatApp', ['ionic'])

.config(function ($compileProvider){
	// Needed for routing to work
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|tel):/);
})

.config(function($stateProvider, $urlRouterProvider) {
	function checkLogin($state) {
		// var token = Stitme.Helper.Token.getAuthorizationToken();
		// if (!token || token === '') {
		// 	$state.transitionTo('wellcome');
		// }
		//console.log('login oke!');
		if (!window.userData){
			$state.transitionTo('main');
		}
	}
	$stateProvider
	// .state('wellcome', {
	// 	url: '/',
	// 	templateUrl : 'js/views/wellcome.html',
	// 	controller: 'WellcomeCtrl'
	// })
	// .state('login', {
	// 	url: '/login',
	// 	templateUrl : 'js/views/login.html',
	// 	controller : 'LoginCtrl'
	// })
	// .state('signup', {
	// 	url: '/signup',
	// 	templateUrl : 'js/views/signup.html',
	// 	controller : 'SignupCtrl'
	// })
	.state('main', {
		url: '/',
		templateUrl : 'js/views/main.html',
		controller : 'MainCtrl'
	})

	.state('chat', {
		url: '/chat',
		templateUrl : 'js/views/chat.html',
		controller : 'ChatCtrl',
		onEnter: checkLogin
	})

	// .state('main.stitme', {
	// 	url: '/',
	// 	views: {
	// 		'stitme-tab': {
	// 			templateUrl: "js/views/main/stitme.html",
	// 			controller: 'Main_StitmeCtrl'
	// 		}
	// 	},
	// 	onEnter: checkLogin
	// })
	
	;
	$urlRouterProvider.otherwise("/");
})
// .run(function(ConversationService, SqlService){
// 	document.addEventListener("pause", onPause, false);
// 	document.addEventListener("resume", onResume, false);
// 	document.addEventListener("online", onOnline, false);
// 	document.addEventListener("offline", onOffline, false);

// 	ionic.Platform.ready(onReady);

// 	function onReady(){
// 		phoneStatus.isReady = true;
// 		window.StitMeApp = StitMeAppInit();
// 		SqlService.init();
// 	}
// 	function onPause(){
// 		console.log('onPause');
// 		phoneStatus.isBackground = true;
// 	}
// 	function onResume(){
// 		console.log('onResume');
// 		phoneStatus.isBackground = false;
// 		ConversationService.onNetworkConnect();
// 	}
// 	function onOnline(){
// 		console.log('onOnline');
// 		phoneStatus.isOnline = true;
// 		ConversationService.onNetworkConnect();
// 	}
// 	function onOffline(){
// 		console.log('onOffline');
// 		phoneStatus.isOnline = false;
// 		ConversationService.onNetworkDisconnect();
// 	}

// 	// Support Chrome web view:
// 	if(!ionic.Platform.isWebView()){
// 		phoneStatus.isOnline = true;
// 		ConversationService.onNetworkConnect();
// 	}
// });


ChatApp.directive('onHold', function($ionicGesture) {
	return {
		restrict: 'A',
		scope: {
			data:'=data',
			handle: '&handle'
		},
		link: function($scope, $element, $attr) {
			var handleHold = function(e) {
				if($scope.data.type === 'me' ) {
					$scope.data.topPosition = $element[0].parentElement.parentElement.offsetTop;
					$scope.handle.call();
				}
			};
			
			var holdGesture = $ionicGesture.on('hold', handleHold, $element);
			$scope.$on('$destroy', function() {
				$ionicGesture.off(holdGesture, 'hold', handleHold);
			});
		}
	};
})
.directive('onSwipe', function($ionicGesture) {
	return {
		restrict: 'A',
		scope: {
			handle: '&handle',
			swiptEvent: '@swiptEvent'
		},
		link: function($scope, $element, $attr) {
			var handleSwipe = function(e) {
				$scope.handle();
			};
			var gesture = $ionicGesture.on($scope.swiptEvent, handleSwipe, $element);
			$scope.$on('$destroy', function() {
				$ionicGesture.off(gesture, $scope.swiptEvent, handleSwipe);
			});
		}
	};
})
.directive('onRender', function() {
	return function(scope, element, attrs) {
		scope.$eval(attrs.onRender);
	}
})
.directive('onTouch', function() {
  return {
		restrict: 'A',
		link: function(scope, elm, attrs) {
			var ontouchFn = scope.$eval(attrs.onTouch);
			elm.bind('touchmove', function(evt) {
				scope.$apply(function() {
					ontouchFn.call(scope, evt);
				});
			});
			elm.bind('touchstart', function(evt) {
				scope.$apply(function() {
					ontouchFn.call(scope, evt);
				});
			});
		}
	};
})
.directive('focusMe', function($timeout) {
	return {
		link: function(scope, element, attrs) {
			scope.$watch(attrs.focusMe, function(value) {
				if(value === true) {
					//console.log('value=', value);
					$timeout(function() {
						scope.$apply(function(){
							element[0].focus();
							scope[attrs.focusMe] = false;
						});
					});
				}
			});
		}
	};
})


;

angular.module('commonFilters', [])
.filter('jstime', function() {
	return function(input) {
		if(input === 0) {
			return '';
		}
		var date = new Date(input);
		var today = new Date();
		var timeDiff = (today-date)/(1000*60*60*24);
		if(timeDiff < 1) {
			var hours = date.getHours();
			var label = hours < 12 ? 'AM' : 'PM';
			var minutes = date.getMinutes();

			hours = hours % 12;
			if(hours === 0) {
				hours = 12;
			}
			else if(hours < 10){
				hours = '0' + hours;
			}
			if(minutes < 10){
				minutes = '0' + minutes;
			}
			return hours + ':' + minutes + ' ' + label;
		}
		else if(timeDiff < 7){
			var weekday = new Array(7);
			weekday[0] = "Sunday";
			weekday[1] = "Monday";
			weekday[2] = "Tuesday";
			weekday[3] = "Wednesday";
			weekday[4] = "Thursday";
			weekday[5] = "Friday";
			weekday[6] = "Saturday";
			return weekday[date.getDay()];
		}
		else if(today.getYear() - date.getYear() === 0) {
			return date.getMonth() + '-' + date.getDate();
		}
		else{
			return date.getMonth() + '-' + date.getDate() + '-' +  date.getFullYear();
		}
	};
})
.filter('timeLeft', function() {
	return function(input) {
		var result = '';
		if(input >= 3600) {
			result += Math.floor(input / 3600) + ':';
		}
		var minutes = Math.floor((input % 3600) / 60);
		result += (minutes < 10 ? '0' + minutes : minutes) + ':';
		var seconds = input % 60;
		result += seconds < 10 ? '0' + seconds : seconds;
		return result;
	};
})
.filter('phoneNumber', function() {
	return function(input) {
		if(!input) {
			return '';
		}
		else {
			return '+1 ' + input.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
		}
	};
})
.filter('contactFilter', function() {
  return function(friends, searchText) {
	if(searchText === '' || searchText == undefined){
		return friends;
	}
	var searchRegx = new RegExp(searchText, "i");
	searchText = searchText.toLowerCase();
	var result = [];
	for(i = 0; i < friends.length; i++) {
		if (friends[i].Name && friends[i].Name.search(searchRegx) != -1) {
			result.push(friends[i]);
		}
		else if (friends[i].name && friends[i].name.search(searchRegx) != -1) {
			result.push(friends[i]);
		}
		else if(friends[i].uid && friends[i].uid.search(searchRegx) != -1) {
			result.push(friends[i]);
		}
	}
	return result;
  }
});

