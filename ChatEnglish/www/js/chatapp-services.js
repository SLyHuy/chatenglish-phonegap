ChatApp.factory('appService', function($rootScope, $interval, $timeout) {
	function checkLogin(callback){
		factory.getLoginStatus(function(response) {
			console.log(response);
			if (response.status === 'connected') {
				callback && callback(response.authResponse);
			}
			else{
				callback && callback(false);
			}
		}, function(response){
			console.log(response);
			callback && callback(false);
		}

		);
	};

	var timer;

	function doLogin(callback){
		var isLoginByTimer = false;

		// timer = $interval(function(){
		// 	checkLogin(function(authResponse){
		// 		if (response.status === 'connected') {
		// 			isLoginByTimer = true;
		// 			$interval.cancel(timer);
		// 			callback && callback(authResponse);
		// 		}
		// 	});
		// }, 200);

		facebookConnectPlugin.login(['email','public_profile','user_friends'], function(response) {
			console.log(response);
			$interval.cancel(timer);
			if (isLoginByTimer){
				return;
			}
			if(response.authResponse) {
				// FB.api('/me', function(response) {
				// 	console.log(response);
				// });
				callback && callback(response.authResponse);
			} else {
				
			}
			
		}, function(response){
			console.log('User cancelled login or did not fully authorize.');
			console.log(response)
			callback && callback(false);
		});
	};

	return {
		checkLogin: checkLogin,
		doLogin: doLogin
	};
});


ChatApp.factory('chatService', function(/*$location, $rootScope, $http, $state, $ionicLoading*/ WebsocketService){
	// callbackSendMessage, callbackReceiveMessage, callbackConnect, callbackClose
	var callbacks = {};
	function init(_callbacks){
		callbacks = _callbacks;
		ensureConnect();
	};

	function onConnect(){
		console.log('Websocket connected!!');
		// for (var i = 0 ; i < _querePendingMessage.length ; i++){
		// 	var message = _querePendingMessage[i];
		// 	sendSocketMessage(message.type, message.content);
		// }
		// _querePendingMessage = [];
		callbacks.callbackConnect && callbacks.callbackConnect();
	};

	function onClose(){
		console.log('Websocket close');
		callbacks.callbackClose && callbacks.callbackClose();
	};

	function ensureConnect(){
		var state = WebsocketService.getState();
		console.log(state);
		if (state !== 0 && state !== 1) {
			var uuid = 'browser';
			if (window.device){
				uuid = window.device.uuid;
			}
			var url = Config.urlWebSocket + '?userID=' + userData.userID + '&accessToken=' + userData.accessToken + '&uuid=' + uuid;
			
			console.log('Connecting... ' + url);
			WebsocketService.unbind('open', onConnect);
			WebsocketService.unbind('close', onClose);
			WebsocketService.unbind('message', onReceiceMessage);

			WebsocketService.bind('open', onConnect);
			WebsocketService.bind('close', onClose);
			WebsocketService.bind('message', onReceiceMessage);
			WebsocketService.connect(url);

			console.log(state);

			return false;
		}
		if (state === 0){
			return false;
		}
		return true;
	};

	function onReceiceMessage(payload){
		console.log(payload);
		payload = angular.fromJson(payload);

		callbacks.callbackReceiveMessage && callbacks.callbackReceiveMessage(payload);
	};

	function sendMessage(messageData){
		//if (typeof messageData == 'object'){
			messageData = JSON.stringify(messageData);
		//}
		WebsocketService.send('message', messageData);
		callbacks.callbackSendMessage && callbacks.callbackSendMessage();
	};

	function exit(){
		WebsocketService.disconnect();
	};

	return {
		init: init,
		ensureConnect: ensureConnect,
		sendMessage: sendMessage,
		exit: exit

	};
});



ChatApp.factory('WebsocketService', function(){
	var callbacks = {};
	var conn;
	function bind(event_name, callback){
		callbacks[event_name] = callbacks[event_name] || [];
		callbacks[event_name].push(callback);
		return this;// chainable
	}

	function unbind(event_name, callback){
		var chain = callbacks[event_name];
		if (typeof chain == 'undefined') return;
		for (var i = chain.length -1 ; i >= 0 ; i--){
			if(chain[i] == callback) {
				chain.splice(i, 1);
				return this;
			}
		}
		return this;// chainable
	}

	function send(event_name, event_data){
		// console.log('websocket send: ' + JSON.stringify(event_data));
		// conn.send(JSON.stringify(event_data));
		console.log('websocket send: ' + event_data);
		if (conn.readyState == 1){
			conn.send(event_data);
		}
		return this;
	}
	
	function connect(url) {
		if (typeof(MozWebSocket) == 'function')
			conn = new MozWebSocket(url);
		else
			conn = new WebSocket(url);

		// dispatch to the right handlers
		conn.onmessage = function(evt){
			dispatch('message', evt.data);
		};

		conn.onclose = function(){dispatch('close',null)};
		conn.onopen = function(){dispatch('open',null)};
	}

	function getState() {
		if(!conn) return -1;
		return conn.readyState;
	}

	function disconnect() {
		if(conn) {
			conn.close();
		}
	}

	function dispatch(event_name, message){
		var chain = callbacks[event_name];
		if(typeof chain == 'undefined') return; // no callbacks for this event
		for(var i = 0; i < chain.length; i++){
			chain[i]( message );
		}
	}
	return {
		bind:bind,
		unbind:unbind,
		send:send,
		connect:connect,
		disconnect:disconnect,
		getState:getState
	};
});