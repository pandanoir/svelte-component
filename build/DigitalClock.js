var DigitalClock = (function () { 'use strict';

function recompute ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'time' in newState && differs( state.time, oldState.time ) ) ) {
		state.hour = newState.hour = template.computed.hour( state.time );
	}
	
	if ( isInitial || ( 'time' in newState && differs( state.time, oldState.time ) ) ) {
		state.minute = newState.minute = template.computed.minute( state.time );
	}
	
	if ( isInitial || ( 'time' in newState && differs( state.time, oldState.time ) ) ) {
		state.second = newState.second = template.computed.second( state.time );
	}
}

var template = (function () {
return {
  data() {
    return {
      time: new Date()
    };
  },
  oncreate() {
    this.interval = setInterval(() => {
      this.set({time: new Date()});
    }, 1000 / 32);
  },
  ondestroy() {
    clearInterval(this.interval);
  },
  computed: {
    hour: time => ('0' + time.getHours()).slice(-2),
    minute: time => ('0' + time.getMinutes()).slice(-2),
    second: time => ('0' + time.getSeconds()).slice(-2),
  }
}
}());

function renderMainFragment ( root, component ) {
	var span = createElement( 'span' );
	
	var last_text = root.hour;
	var text = createText( last_text );
	appendNode( text, span );
	appendNode( createText( " : " ), span );
	var last_text$2 = root.minute;
	var text$2 = createText( last_text$2 );
	appendNode( text$2, span );
	appendNode( createText( " : " ), span );
	var last_text$4 = root.second;
	var text$4 = createText( last_text$4 );
	appendNode( text$4, span );

	return {
		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( ( __tmp = root.hour ) !== last_text ) {
				text.data = last_text = __tmp;
			}
			
			if ( ( __tmp = root.minute ) !== last_text$2 ) {
				text$2.data = last_text$2 = __tmp;
			}
			
			if ( ( __tmp = root.second ) !== last_text$4 ) {
				text$4.data = last_text$4 = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( span );
			}
		}
	};
}

function DigitalClock ( options ) {
	options = options || {};
	this._state = Object.assign( template.data(), options.data );
	recompute( this._state, this._state, {}, true );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.oncreate, context: this });
	} else {
		template.oncreate.call( this );
	}
}

DigitalClock.prototype.get = get;
DigitalClock.prototype.fire = fire;
DigitalClock.prototype.observe = observe;
DigitalClock.prototype.on = on;
DigitalClock.prototype.set = set;
DigitalClock.prototype._flush = _flush;

DigitalClock.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	recompute( this._state, newState, oldState, false )
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

DigitalClock.prototype.teardown = DigitalClock.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );
template.ondestroy.call( this );

	this._fragment.teardown( detach !== false );
	this._fragment = null;

	this._state = {};
	this._torndown = true;
};

function createElement( name ) {
	return document.createElement( name );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function createText( data ) {
	return document.createTextNode( data );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function differs( a, b ) {
	return ( a !== b ) || ( a && ( typeof a === 'object' ) || ( typeof a === 'function' ) );
}

function dispatchObservers( component, group, newState, oldState ) {
	for ( var key in group ) {
		if ( !( key in newState ) ) continue;

		var newValue = newState[ key ];
		var oldValue = oldState[ key ];

		if ( newValue === oldValue && typeof newValue !== 'object' ) continue;

		var callbacks = group[ key ];
		if ( !callbacks ) continue;

		for ( var i = 0; i < callbacks.length; i += 1 ) {
			var callback = callbacks[i];
			if ( callback.__calling ) continue;

			callback.__calling = true;
			callback.call( component, newValue, oldValue );
			callback.__calling = false;
		}
	}
}

function get( key ) {
	return key ? this._state[ key ] : this._state;
}

function fire( eventName, data ) {
	var handlers = eventName in this._handlers && this._handlers[ eventName ].slice();
	if ( !handlers ) return;

	for ( var i = 0; i < handlers.length; i += 1 ) {
		handlers[i].call( this, data );
	}
}

function observe( key, callback, options ) {
	var group = ( options && options.defer ) ? this._observers.pre : this._observers.post;

	( group[ key ] || ( group[ key ] = [] ) ).push( callback );

	if ( !options || options.init !== false ) {
		callback.__calling = true;
		callback.call( this, this._state[ key ] );
		callback.__calling = false;
	}

	return {
		cancel: function () {
			var index = group[ key ].indexOf( callback );
			if ( ~index ) group[ key ].splice( index, 1 );
		}
	};
}

function on( eventName, handler ) {
	if ( eventName === 'teardown' ) return this.on( 'destroy', handler );

	var handlers = this._handlers[ eventName ] || ( this._handlers[ eventName ] = [] );
	handlers.push( handler );

	return {
		cancel: function () {
			var index = handlers.indexOf( handler );
			if ( ~index ) handlers.splice( index, 1 );
		}
	};
}

function set( newState ) {
	this._set( newState );
	( this._root || this )._flush();
}

function _flush() {
	if ( !this._renderHooks ) return;

	while ( this._renderHooks.length ) {
		var hook = this._renderHooks.pop();
		hook.fn.call( hook.context );
	}
}

return DigitalClock;

}());