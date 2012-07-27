Users = new Meteor.Collection("users");
Topics = new Meteor.Collection("topics");
Videos = new Meteor.Collection("videos");

if (Meteor.is_client) {
	

	Session.set('topic_id', null);
	Session.set('editing_topicname', null);
	Session.set('user_id', null);
	Session.set('selected_video', null);
	Session.set('player_mode', null);





	//Meteor.autosubscribe(function () {
  	//	var topic_id = Session.get('topic_id');
  	//	if (topic_id)
   // 		Meteor.subscribe('videos', list_id);
	//});

////////// Helpers for in-place editing //////////

// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
var okcancel_events = function (selector) {
  return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};

// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function (options) {
  var ok = options.ok || function () {};
  var cancel = options.cancel || function () {};

  return function (evt) {
    if (evt.type === "keydown" && evt.which === 27) {
      // escape = cancel
      cancel.call(this, evt);

    } else if (evt.type === "keyup" && evt.which === 13 ||
               evt.type === "focusout") {
      // blur/return/enter = ok/submit if non-empty
      var value = String(evt.target.value || "");
      if (value)
        ok.call(this, value, evt);
      else
        cancel.call(this, evt);
    }
  };
};

// Finds a text input in the DOM by id and focuses it.
var focus_field_by_id = function (id) {
  var input = document.getElementById(id);
  if (input) {
    input.focus();
    input.select();
  }
};


	/////////// User //////////////////////
	
	
	Template.user_summary.loggedin = function () {
  		return Session.get('user_id') != null;
	};
	
	Template.user_summary.events = {
  		'click .login': function (evt) {
    		var name = $('input#name').val().trim();
    		var user_id = Users.findOne({name: name})._id;
    		Session.set("user_id", user_id);
  		},
  		
  		'click': function (evt) {
  					  	$(function() {
  				// Setup drop down menu
    			$('.dropdown-toggle').dropdown();
    			$('.dropdown-menu').find('form').click(function (e) {
        		e.stopPropagation();
      		});
			});
  			
  		}
	};
	
	Template.user_summary.user_name = function () {
  		return Users.findOne(Session.get('user_id')).name;
	};
	
	Template.user_summary.to_user_name = function () {
  		return Users.findOne(Session.get('user_id')).to_user_name;
	};
	
	/////////// Topics ////////////////////////
	

	Template.topics.show = function (){
		return (Session.get("user_id") != null);	
	};		
	
	Template.topics.topics = function () {
  		return Topics.find();
	};

	Template.topics.selected = function () {
  		return Session.equals('topic_id', this._id) ? 'active' : '';
	};

	Template.topics.name_class = function () {
  		return this.name ? '' : 'empty';
	};

	Template.topics.editing = function () {
  		return Session.equals('editing_topicname', this._id);
	};
	
	
	Template.topics.events = {
  		'mousedown .topic': function (evt) { // select list
    		Session.set('topic_id', this._id);
  		}
	};
	
// Attach events to keydown, keyup, and blur on "New list" input box.
Template.topics.events[ okcancel_events('#new-topic') ] =
  make_okcancel_handler({
    ok: function (text, evt) {
      Topics.insert({name: text, questions: []});
		evt.target.value = '';
    }
  });

	
	////////// Videos ////////////////////////
	
	Template.video_list.show = function (){
		return (Session.get("user_id") != null) && (Session.get("topic_id") != null);	
	};	
	
  	Template.video_list.videos = function () {
    	return Videos.find({"topic_id":Session.get("topic_id")});
  	};
  	
	Template.video_list.events = {
    	'click .record': function () {
      	Session.set("player_mode", "record");
   	}
   };

  	Template.video.selected = function () {
    	return Session.equals("selected_video", this._id) ? "selected" : '';
  	};


	Template.video.datetime = function () {
		return new Date(this.timestamp);	
	};
	
	Template.video.events = {
    	'click .video_play_button': function () {
      	Session.set("selected_video", this._id);
      	Session.set("player_mode", "view");
   	}
   };
   
	//////// Player ////////////////////////
	var _Nimbb;

	
	function Nimbb_initCompleted(idPlayer) {
	  	// Get a reference to the player since it was successfully created.
	  	_Nimbb = document[idPlayer];
	  	
	  	var mode = Session.get('player_mode');
	  	
	  	if(mode == 'view'){
	  		_Nimbb.setMode('view');	
	  		_Nimbb.setGuid(Videos.findOne({_id: Session.get('selected_video')}).nimbb_guid);
			_Nimbb.playVideo();
		}
	}
	
	
	function Nimbb_videoSaved(idPlayer){
				
		var guid = _Nimbb.getGuid();
		var user = Users.findOne(Session.get('user_id'));

		Videos.insert({topic_id: Session.get('topic_id'),
							user_id: user._id,
							user_name: user.name,
							timestamp : (new Date()).getTime(),
							nimbb_guid : guid
							});
		
		Session.set('player_mode', null);
	}
	
	
	Template.player.show = function () {

		if(Session.get('player_mode') != null){
			$('#myModal').modal('show');
		} else {
			$('#myModal').modal('hide');	
		}
		
		
		return Session.get('player_mode') != null;
	};
	
	Template.player.mode = function () {
		return Session.get('player_mode');
	};
	
	Template.player.events = {
    	'click .close_player': function () {
      	Session.set("player_mode", null);
   	}
   };
   
   
   ///////////// Questions ///////////////////
   
     	Template.player.questions = function () {
    	return Topics.findOne({_id:Session.get("topic_id")}).questions;
  	};
  	
  

}




if (Meteor.is_server) {
  Meteor.startup(function () {
    if (Topics.find().count() < 5) {
    	Topics.remove({});
    	Users.remove({});
    	Videos.remove({});
    	
    	  var user_id = Users.insert({name: "Mark", to_user_name: "John"});
    	  
		  var to_user_id = Users.insert({name: "John", to_user_name: "Mark"});
   	  
Topics.insert({name: 
"Introduction", questions: [
"What is your name?",
"How old are you?",
"What city and country do you live in?",
"What is your favorite thing about your city and country?",
"What do you want to be when you grow up and why?"]});

Topics.insert({name: 
"Family", questions: [
"Who do you live with?",
"What do you like about your family?",
"Where else do you have family?",
"Do you travel there much?",
"How do you feel when you are with your family?"]});

Topics.insert({name: 
"Foods", questions: [
"What is your favorite food and why?",
"What is your most common breakfast?",
"What is your most common lunch?",
"What is your most common dinner?",
"Which meal of the day is your favorite and why?"]});

Topics.insert({name: 
"Sports", questions: [
"What is your favorite sport and why?",
"How often do you play that sport?",
"What is your favorite sports team and why?",
"How does playing that sport make you feel?",
"What is your least favorite sport and why?"]});

Topics.insert({name: 
"Holidays", questions: [
"What is your favorite holiday and why?",
"What is the background and meaning of that holiday?",
"What do you do on that holiday?",
"How do you feel on that holiday?",
"Who do you spend that holiday with?"]});

Topics.insert({name: 
"Daily life", questions: [
"What time do you go to school?",
"What do you usually do after school?",
"What do you do at night after dinner?",
"What time do you wake up and go to bed?",
"What is your favorite time of the day and why?"]});
    }
  });
}
