ChatApp.controller('MainCtrl', function($scope, $state, $ionicLoading, appService){
	$scope.title = 'Chat English';
	$scope.titleBtn = 'New Chat';
	$scope.textHeader = 'Start chatting with Stranger';
	$scope.isLogin = window.isLogin = true;
	var fbInited = false;
	
	$scope.newChat = function(){
		if (!fbInited){
			return;
		}
		//$state.transitionTo('chat');

		if (!window.isLogin || window.userData == undefined || !window.userData.userID || window.userData.userID == 'null'){
			// $ionicLoading.show({
			// 	template: 'Please login!'
			// });
			appService.doLogin(function(result){
				console.log(result);
				if (result){	

					window.userData = result;

					$scope.$apply(function(){
						window.isLogin = $scope.isLogin = true;
						$scope.titleBtn = 'New Chat';
						$scope.textHeader = 'Start chatting with Stranger';

						$state.transitionTo('chat');
					});
				}
				else{

				}
				
				
			});
		}
		else{
			$state.transitionTo('chat');
		}
		
	};

	var callbackFB = function(){
		//check fb login status
		//return;
		appService.checkLogin(function(response){
			//$scope.$apply(function(){
				if (response && response.userID != null && response.userID != 'null'){
					window.isLogin = $scope.isLogin = true;
					$scope.titleBtn = 'New Chat';
					$scope.textHeader = 'Start chatting with Stranger';

					window.userData = response;
				}
				else{
					window.isLogin = $scope.isLogin = false;
					$scope.textHeader = 'Login with Facebook to start chatting with the stranger'
					$scope.titleBtn = 'Login';
				}
				$ionicLoading.hide();
			//});
			
		});
				
	};

    // if ((typeof cordova == 'undefined') && (typeof Cordova == 'undefined')) alert('Cordova variable does not exist. Check that you have included cordova.js correctly');
    // if (typeof CDV == 'undefined') alert('CDV variable does not exist. Check that you have included cdv-plugin-fb-connect.js correctly');
    // if (typeof FB == 'undefined') alert('FB variable does not exist. Check that you have included the Facebook JS SDK file.');
	if (typeof window.userData == 'undefined' || window.userData == null || (!window.cordova && typeof window.FB == 'undefined')){

		$ionicLoading.show({
			template: 'Loading facebook connection...'
		});

		fbInited = false;
		$scope.titleBtn = 'Loading...';

		if (window.cordova){
			// if in webview (such as cordova)
			if (window.userData === null || window.userData == 'null'){
				fbInited = true;
				callbackFB();
			}
			else{
				ionic.Platform.ready(function(){
					// FB.init({
					// 	appId: Config.fbAppId,
					// 	nativeInterface: CDV.FB,
					// 	useCachedDialogs: false
					// });
					fbInited = true;
					callbackFB();
				});
			}
		}
		else{
			//for debug localhost on web, not using in real web.
			//init callback FB
			window.fbAsyncInit = function() {
				FB.init({
					appId: Config.fbAppId,
					xfbml: true,
					version: 'v2.0'
				});
				fbInited = true;
				callbackFB();
			};

			//Load FB SDK
			(function(d, s, id) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if(d.getElementById(id)) {
					return;
				}
				js = d.createElement(s);
				js.id = id;
				js.src = "https://connect.facebook.net/en_US/sdk.js";
				fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));
		}
	}
	else{
		$ionicLoading.show({
			template: 'Checking...'
		});
		fbInited = true;
		callbackFB();
	}
});
