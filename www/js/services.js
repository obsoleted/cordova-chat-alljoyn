var chatApp = angular.module('chatApp');

chatApp.factory('chatService', function($rootScope, $q) {
  // Initialize the AllJoyn chat session if the AllJoyn API
  // is available.
  if (window.AllJoyn) {
    // This initialization call is required once before doing
    // other AllJoyn operations. Since this Angular service is
    // a singleton, we should end up calling this only once.
    AllJoynWinRTComponent.AllJoyn.aj_Initialize();

    var AJ_CHAT_SERVICE_NAME = "org.alljoyn.bus.samples.chat.";
    var AJ_CHAT_SERVICE_PATH = "/chatService";
    var AJ_CHAT_SERVICE_PORT = 27;
    var AJ_CHAT_INTERFACE = [
      "org.alljoyn.bus.samples.chat",
      "!Chat str>s",
      ""
    ];
    var AJ_CHAT_INTERFACES = [AJ_CHAT_INTERFACE, null];
    var AJ_CONNECT_TIMEOUT = 1000 * 5;

    var aj_busAttachment = new AllJoynWinRTComponent.AJ_BusAttachment();
    var aj_sessionId = 0;

    // Create and registed app objects based on the service
    // and interface definitions above.
    var aj_appObject = new AllJoynWinRTComponent.AJ_Object();
    aj_appObject.path = AJ_CHAT_SERVICE_PATH;
    aj_appObject.interfaces = AJ_CHAT_INTERFACES;
    AllJoynWinRTComponent.AllJoyn.aj_RegisterObjects(null, [aj_appObject, null]);

    var aj_daemonName = "";
    var aj_status = AllJoynWinRTComponent.AllJoyn.aj_FindBusAndConnect(aj_busAttachment, aj_daemonName, AJ_CONNECT_TIMEOUT);
    if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
      console.log('Found bus and connected.');
      AllJoynMessageHandler.start(aj_busAttachment);
    } else {
      console.log('Could not connect to the bus.');
    }
  }

  var chatService = {};

  var channelsModel = {
    channels: [],
    currentChannel: null,
    getChannel: function(name) {
      for (var i = 0; i < this.channels.length; i++) {
        if (this.channels[i].name = name) return this.channels[i];
      }
    }
  };

  var currentChannelMessages = function() {
    return channelsModel.currentChannel && channelsModel.currentChannel.messages || [];
  };
  chatService.currentChannelMessages = currentChannelMessages;

  chatService.currentChannel = function() {
    return channelsModel.currentChannel;
  };
  chatService.setCurrentChannel = function(channel) {
    if (aj_sessionId !== 0) {
      // TODO: Call leave session
    }
    // Use null value as session options, which means that AllJoyn will use the default options
    var aj_sessionOptions = null;
    var aj_status = AllJoynWinRTComponent.AllJoyn.aj_BusJoinSession(aj_busAttachment, AJ_CHAT_SERVICE_NAME + channel.name, AJ_CHAT_SERVICE_PORT, aj_sessionOptions);
    if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
      AllJoynMessageHandler.addHandler(
        AllJoynWinRTComponent.AllJoyn.aj_Reply_ID(AllJoynWinRTComponent.AllJoyn.aj_Bus_Message_ID(1, 0, 10)),
        function(value) {
          console.log("Joined session: " + value);
          // TODO: Get session id from the reply
        }
      );
      channelsModel.currentChannel = channel;
      $rootScope.$broadcast('currentChannelChanged', channel);
    }
  };

  chatService.postCurrentChannel = function(message) {
    if (window.AllJoyn) {
      var aj_messageId = AllJoynWinRTComponent.AllJoyn.aj_Prx_Message_ID(0, 0, 0);
      var aj_message = new AllJoynWinRTComponent.AJ_Message();
      // An empty string is used as a destination, because that ends up being converted to null platform string
      // in the Windows Runtime Component. A null value as destination in ajtcl means that the destination is not set and
      // chat message ends up being sent to everybody in the session. If using the channel's well-known name as
      // the destination, only the channel owner would receive the message.
      var aj_destination = "";
      var aj_status = AllJoynWinRTComponent.AllJoyn.aj_MarshalSignal(aj_busAttachment, aj_message, aj_messageId, aj_destination, aj_sessionId, 0, 0);
      console.log("aj_MarshalSignal resulted in a status of " + aj_status);

      if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
        aj_status = AllJoynWinRTComponent.AllJoyn.aj_MarshalArgs(aj_message, "s", [message.text]);
        console.log("aj_MarshalArgs resulted in a status of " + aj_status);
      }

      if (aj_status == AllJoynWinRTComponent.AJ_Status.aj_OK) {
        aj_status = AllJoynWinRTComponent.AllJoyn.aj_DeliverMsg(aj_message);
        console.log("aj_DeliverMsg resulted in a status of " + aj_status);
      }

      // Messages must be closed to free resources.
      AllJoynWinRTComponent.AllJoyn.aj_CloseMsg(aj_message);
    }

    channelsModel.currentChannel.messages.push(message);
    $rootScope.$broadcast('newMessage', message);
  };

  chatService.getChannels = function() {
    var deferred = $q.defer();
    if (window.AllJoyn) {
      var AJ_BUS_START_FINDING = 0;
      var AJ_BUS_STOP_FINDING = 1;
      var aj_status = AllJoynWinRTComponent.AllJoyn.aj_BusFindAdvertisedName(aj_busAttachment, AJ_CHAT_SERVICE_NAME, AJ_BUS_START_FINDING);
      AllJoynMessageHandler.addHandler(
        AllJoynWinRTComponent.AllJoyn.aj_Bus_Message_ID(1, 0, 1),
        function(value) {
          channelName = value.split('.').pop();
          channelsModel.channels = [new Channel(channelName)];
          AllJoynWinRTComponent.AllJoyn.aj_BusFindAdvertisedName(aj_busAttachment, AJ_CHAT_SERVICE_NAME, AJ_BUS_STOP_FINDING);
          deferred.resolve(channelsModel.channels);
        }
      );
    } else {
      setTimeout(function() {
        channelsModel.channels = [new Channel('My Channel'), new Channel('Another Channel')];
        deferred.resolve(channelsModel.channels);
      }, 100);
    }
    return deferred.promise;
  };

  if (window.AllJoyn) {
    // Handler for new chat messages
    AllJoynMessageHandler.addHandler(
      // Message id for new messages to the interface we have defined
      AllJoynWinRTComponent.AllJoyn.aj_Prx_Message_ID(0, 0, 0),
      function(value) {
        console.log("Received message: " + value);
        if (channelsModel.currentChannel == null) return;
        var message = new Message(value);
        // The $rootScope needs to be accessed in a non-standard way
        // inside of the function run within setInterval or otherwise things
        // don't work correctly.
        // Approach taken from http://stackoverflow.com/questions/24595460/how-to-access-update-rootscope-from-outside-angular .
        var $rootScope = angular.element(document.body).scope().$root;
        $rootScope.$apply(function() {
          channelsModel.currentChannel.messages.push(message);
          $rootScope.$broadcast('newMessage', message);
        });
      }
    );
  }

  return chatService;
});