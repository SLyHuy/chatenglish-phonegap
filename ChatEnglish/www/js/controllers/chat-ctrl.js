ChatApp.controller('ChatCtrl', function($scope, $state, $timeout, $interval, $ionicScrollDelegate, $ionicPopover, $ionicModal, $ionicPopup, $ionicNavBarDelegate, chatService){
	$scope.title = 'Chat English';
	$scope.chats = [];
	$scope.reportData = {};

	$scope.inBlockList = false;
	var blocks = [];
	var isBlock = false;

	if (window.device){
		if (window.device.platform.toLowerCase() == 'android'){
			var vers = window.device.version.split('.');

			if (vers[0] < 4 || vers[1] < 4){
				// < Kitkat 4.4				
				$scope.lowerKitKat = true;
			}
			else{
				// >= Kitkat 4.4
				$scope.lowerKitKat = false;
			}
		}
	}
	

	console.log(userData);

	function keyboardShowHandler(e){
		// var element = document.getElementById('chatDetailView');
		// element.style['height'] = (e.clientHeight - e.keyboardHeight) + 'px';
		$ionicScrollDelegate.resize();

		//console.log('show');

		//$timeout(function(){
		// 	var position = $ionicScrollDelegate.getScrollPosition();
		// 	position.top += (e.keyboardHeight);
		// 	$ionicScrollDelegate.scrollTo(position.left, position.top);
		// 	//console.log('show + count');
			$ionicScrollDelegate.scrollBottom(false);
		//});
	}
	
	function keyboardHideHandler(e){
		// var element = document.getElementById('chatDetailView');
		// element.style['height'] = '';
		$ionicScrollDelegate.resize();
		//console.log('hide');
		
	}

	function initChat(){

		var localBlocks = window.localStorage.getItem('blocks');
		if (localBlocks){
			blocks = JSON.parse(localBlocks);
		}

		if(ionic.Platform.isWebView()){
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
			cordova.plugins.Keyboard.disableScroll(true);
		}

		window.addEventListener('native.keyboardshow', keyboardShowHandler);
		window.addEventListener('native.keyboardhide', keyboardHideHandler);

		
		chatService.init({
			callbackSendMessage: function(){},
			callbackReceiveMessage: receiveChat,
			callbackConnect: function(){},
			callbackClose: onClose
		});

		// var uuid = 'browser';
		// if (window.device){
		// 	uuid = window.device.uuid;
		// }
		// var url = Config.urlWebSocket;// + '?userID=' + userData.userID + '&accessToken=' + userData.accessToken + '&uuid=' + uuid;

		// var conn = new WebSocket(url);

		// console.log(conn);
		// console.log(url);

		// conn.onerror = function(e){
		// 	console.log('error');
		// 	console.log(e);
		// }

		// conn.onopen = function(){
		// 	console.log('Open');
		// };

		// conn.onclose = function(){
		// 	console.log('Close');
		// }
	};

	function onClose(){
		$scope.$apply(function(){
			$scope.chats.push({
				type: 'system',
				content: 'You has been disconnected, please exit and make new chat.'
			});
			$ionicScrollDelegate.scrollBottom(true);
		});
	}

	var isTyping = false;
	var timer;
	var lastTimeKeyPress = 0;
	var typingEle;
	var timeChat = new Date();

	function receiveChat(data){
		var content;

		if ($scope.chats.length > 0){
			if ($scope.chats[$scope.chats.length - 1].type == 'typing'){
				$scope.chats.pop();
			}
		}

		if (data.type == 'chat'){
			content = {
				type: data.from == 'system' ? 'system' : 'stranger',
				content : data.message
			};

			if (timer){
				isTyping = false;
				$interval.cancel(timer);
			}

			if (data.from == 'system' && data.message == 'Error! Please try again.'){
				window.userData = null;
			}

		}
		else if (data.type == 'action'){
			if (data.action == 'typing'){
				content = {
					type: 'typing'
				};
			}
			else{
				
			}
		}

		//Check Like function
		if (data.stranger){
			$scope.haveStranger = true;			
			$scope.strangerLiked = data.stranger.isLiked;

			$scope.infoStranger = {
				fullId: data.stranger.id,
				shortId: parseInt(data.stranger.id, 10),
				liked: data.stranger.liked
			};

			//Check blocklist
			if (data.from == 'system'){
				for (var i = 0; i < blocks.length; i++){
					if (blocks[i] == data.stranger.id){
						isBlock = true;
						$scope.inBlockList = true;
						break;
					}
				}

				if (isBlock){
					$ionicPopup.confirm({
						title: '',
						template: '<h4 class="title text-center">Stranger was blocked by you. Do you want to continue to chat with him?</h4>',
						cancelText: 'Yes',
						okText: 'No, I don\'t.'
					}).then(function(res){
						if (!res){
							//Yes
							isBlock = false;
						}
						else {
							//No
							chatService.exit();
							$ionicNavBarDelegate.back();
						}
					});
				}
			}
			
		}

		if (content){
			if (isBlock && data.from == 'stranger'){

			}
			else{
				$scope.chats.push(content);
			}			
		}
		
		$scope.$apply(function(){
			$ionicScrollDelegate.scrollBottom(true);
		});
	}

	

	$scope.sendChat = function(){
		var that = this;
		that.newChat = that.newChat.trim().replace(/\s{2,}/g, ' ');

		var now = new Date();
		if (now - timeChat < 1000){
			timeChat = new Date();
			return false;
		}

		var newChat = that.newChat;
		if (newChat && newChat !== ''){
			if (timer){
				isTyping = false;
				$interval.cancel(timer);
			}


			chatService.sendMessage({
				type: 'chat',
				message: newChat
			});

			var content = {
				type: 'me',
				content : newChat
			};

			if ($scope.chats.length > 0 && $scope.chats[$scope.chats.length - 1].type == 'typing'){
				$scope.chats.splice($scope.chats.length - 1, 0, content);
			}
			else{
				$scope.chats.push(content);
			}
			
			$ionicScrollDelegate.scrollBottom(true);

		}

		that.newChat = '';
		$scope.focusInput = true;
		timeChat = new Date();
	};


	//Keypress not working with the phone using Swype
	$scope.chatKeyAction = function(e){
		lastTimeKeyPress = e.timeStamp;
		if (e.keyIdentifier == 'Enter' || e.keyCode == 13 || e.which == 13){
			return;
		}
		if (isTyping == false){
			isTyping = true;
			chatService.sendMessage({
				type: 'action',
				action: 'typing'
			});
			$interval.cancel(timer);
			timer = $interval(function(){
				if (isTyping && (new Date()).getTime() - lastTimeKeyPress > 4000){
					isTyping = false;
					$interval.cancel(timer);
					chatService.sendMessage({
						type: 'action',
						action: 'stop type'
					});
				}
			}, 1000);
		}
		else{

		}
	}

	$scope.likeStranger = function(){
		if ($scope.strangerLiked){
			return false;
		}
		$scope.strangerLiked = true;

		chatService.sendMessage({
			type: 'action',
			action: 'like'
		});
		$scope.infoStranger.liked++;

		$scope.popoverChat.hide();

		var content = {
			type: 'system',
			content : 'You\'ve just like the stranger. Thank you.'
		};

		$scope.chats.push(content);
		$ionicScrollDelegate.scrollBottom(true);
	};

	$ionicPopover.fromTemplateUrl('templates/popover.html', {
		scope: $scope,
	}).then(function(popover) {
    	$scope.popoverChat = popover;
	});

	$scope.showPopoverChat = function($event){
		$scope.popoverChat.show($event);
	};

	$ionicModal.fromTemplateUrl('templates/report-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal){
		$scope.reportModal = modal;
	});

	$scope.openReportModal = function(){
		if ($scope.reported){
			return false;
		}
		$scope.reportModal.show();
	};

	$scope.closeReportModal = function(){
		$scope.reportModal.hide();
	};

	$scope.sendReport = function(){
		if ($scope.reported){
			return false;
		}

		if (!$scope.reportData.reason){
			$ionicPopup.alert({
				template: '<h4 class="title text-center">Please choose reason</h4>'
			});
		}
		else{
			chatService.sendMessage({
				type: 'report',
				reason: $scope.reportData.reason
			});
			$scope.reported = true;

			$ionicPopup.alert({
				template: '<h4 class="title text-center">Your report has been sent. Thank you.</h4>'
			}).then(function(){
				$scope.reportModal.hide();
				$scope.popoverChat.hide();
			});

		}
	};

	$ionicModal.fromTemplateUrl('templates/info-modal.html', {
		scope: $scope,
		animation: 'slide-in-up'
	}).then(function(modal){
		$scope.infoModal = modal;
	});

	$scope.openInfoModal = function(){
		$scope.infoModal.show();
	};

	$scope.closeInfoModal = function(){
		$scope.infoModal.hide();
	};

	$scope.blockStranger = function(){
		var template = '<h4 class="title text-center">Do you want block stranger and exit?</h4>';
		if ($scope.inBlockList){
			template = '<h4 class="title text-center">Do you want unblock stranger?</h4>';
		}
		$ionicPopup.confirm({
			title: '',
			template: template,
			okText: 'Yes'
		}).then(function(res){
			if (res){
				if ($scope.inBlockList == false){
					blocks.push($scope.infoStranger.fullId);
					window.localStorage.setItem('blocks', JSON.stringify(blocks));
					$scope.inBlockList = true;

					$scope.popoverChat.hide();
					chatService.exit();
					$ionicNavBarDelegate.back();
				}
				else{
					for (var i = 0; i < blocks.length; i++){
						if (blocks[i] == $scope.infoStranger.fullId){
							blocks.splice(i, 1);
							break;
						}
					}
					$scope.inBlockList = false;
					isBlock = false;
					$scope.popoverChat.hide();
				}				
			}
			else {
				
			}
		});
		
	};


	initChat();
});


ChatApp.controller('navBarCtrl', function($scope, $state, $ionicNavBarDelegate, chatService){
	$scope.exit = function(){
		console.log('User exit!!');
		chatService.exit();

		$ionicNavBarDelegate.back();
	}
});
