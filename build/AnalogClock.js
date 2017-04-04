var AnalogClock = (function () { 'use strict';

function recompute ( state, newState, oldState, isInitial ) {
	if ( isInitial || ( 'hour' in newState && differs( state.hour, oldState.hour ) ) || ( 'minute' in newState && differs( state.minute, oldState.minute ) ) || ( 'second' in newState && differs( state.second, oldState.second ) ) ) {
		state.hourDeg = newState.hourDeg = template.computed.hourDeg( state.hour, state.minute, state.second );
	}
	
	if ( isInitial || ( 'minute' in newState && differs( state.minute, oldState.minute ) ) || ( 'second' in newState && differs( state.second, oldState.second ) ) ) {
		state.minuteDeg = newState.minuteDeg = template.computed.minuteDeg( state.minute, state.second );
	}
	
	if ( isInitial || ( 'second' in newState && differs( state.second, oldState.second ) ) ) {
		state.secondDeg = newState.secondDeg = template.computed.secondDeg( state.second );
	}
}

var template = (function () {
return {
  oncreate() {
    if (this.get('hour') != null && this.get('minute') != null) {
      this.set({
        hour: parseInt(this.get('hour'), 10),
        minute: parseInt(this.get('minute'), 10),
        second: parseInt(this.get('second') || 0, 10)
      });
    } else if (this.get('utc') != null) {
      const UTCHour = parseInt(this.get('utc').split(':')[0], 10),
        UTCMinute = parseInt(this.get('utc').split(':')[1], 10) || 0;
      const update = () => {
        this.set({
          hour: new Date().getUTCHours() + UTCHour,
          minute: new Date().getUTCMinutes() + UTCMinute,
          second: new Date().getUTCSeconds()
        });
      }
      this.interval = setInterval(update, 1000 / 32);
      update();
    } else {
      const update = () => {
        this.set({
          hour: new Date().getHours(),
          minute: new Date().getMinutes(),
          second: new Date().getSeconds()
        });
      }
      this.interval = setInterval(update, 1000 / 32);
      update();
    }
  },
  ondestroy() {
    clearInterval(this.interval);
  },
  computed: {
    hourDeg: (hour, minute, second) => (hour % 12 + (minute + second / 60) / 60) / 12 * 360,
    minuteDeg: (minute, second) => (minute + second / 60) / 60 * 360,
    secondDeg: second => second / 60 * 360
  }
};
}());

var addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n  [svelte-1371016426].border, [svelte-1371016426] .border {\n    position: relative;\n    border: 4px solid #444;\n    border-radius: 50%;\n    width: 80px;\n    height: 80px;\n    box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.3), inset 0px 1px 1px rgba(0, 0, 0, 0.3);\n  }\n  [svelte-1371016426].board, [svelte-1371016426] .board {\n    background: #eee;\n    border-radius: 50%;\n    width: 80px;\n    height: 80px;\n  }\n  [svelte-1371016426].hand, [svelte-1371016426] .hand {\n    position: absolute;\n    top: 50%;\n    left: 50%;\n    width: 2px;\n    margin-left: -1px;\n    background: #000;\n    transform-origin: 1px 100%;\n  }\n  [svelte-1371016426].minute-hand, [svelte-1371016426] .minute-hand {\n    height: 35px;\n    margin-top: -35px;\n  }\n  [svelte-1371016426].hour-hand, [svelte-1371016426] .hour-hand{\n    height: 20px;\n    margin-top: -20px;\n  }\n  [svelte-1371016426].second-hand, [svelte-1371016426] .second-hand{\n    height: 40px;\n    margin-top: -40px;\n    background: #f00;\n  }\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var div = createElement( 'div' );
	setAttribute( div, 'svelte-1371016426', '' );
	div.className = "border";
	
	var div$1 = createElement( 'div' );
	setAttribute( div$1, 'svelte-1371016426', '' );
	div$1.className = "board";
	
	appendNode( div$1, div );
	
	var div$2 = createElement( 'div' );
	setAttribute( div$2, 'svelte-1371016426', '' );
	div$2.className = "hand second-hand";
	div$2.style.cssText = "transform: rotate(" + ( root.secondDeg ) + "deg)";
	
	appendNode( div$2, div$1 );
	appendNode( createText( "\n    " ), div$1 );
	
	var div$3 = createElement( 'div' );
	setAttribute( div$3, 'svelte-1371016426', '' );
	div$3.className = "hand minute-hand";
	div$3.style.cssText = "transform: rotate(" + ( root.minuteDeg ) + "deg)";
	
	appendNode( div$3, div$1 );
	appendNode( createText( "\n    " ), div$1 );
	
	var div$4 = createElement( 'div' );
	setAttribute( div$4, 'svelte-1371016426', '' );
	div$4.className = "hand hour-hand";
	div$4.style.cssText = "transform: rotate(" + ( root.hourDeg ) + "deg)";
	
	appendNode( div$4, div$1 );

	return {
		mount: function ( target, anchor ) {
			insertNode( div, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			div$2.style.cssText = "transform: rotate(" + ( root.secondDeg ) + "deg)";
			
			div$3.style.cssText = "transform: rotate(" + ( root.minuteDeg ) + "deg)";
			
			div$4.style.cssText = "transform: rotate(" + ( root.hourDeg ) + "deg)";
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( div );
			}
		}
	};
}

function AnalogClock ( options ) {
	options = options || {};
	this._state = options.data || {};
	recompute( this._state, this._state, {}, true );
	
	this._observers = {
		pre: Object.create( null ),
		post: Object.create( null )
	};
	
	this._handlers = Object.create( null );
	
	this._root = options._root;
	this._yield = options._yield;
	
	this._torndown = false;
	if ( !addedCss ) addCss();
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.oncreate, context: this });
	} else {
		template.oncreate.call( this );
	}
}

AnalogClock.prototype.get = get;
AnalogClock.prototype.fire = fire;
AnalogClock.prototype.observe = observe;
AnalogClock.prototype.on = on;
AnalogClock.prototype.set = set;
AnalogClock.prototype._flush = _flush;

AnalogClock.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	recompute( this._state, newState, oldState, false )
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

AnalogClock.prototype.teardown = AnalogClock.prototype.destroy = function destroy ( detach ) {
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

function setAttribute( node, attribute, value ) {
	node.setAttribute ( attribute, value );
}

function detachNode( node ) {
	node.parentNode.removeChild( node );
}

function insertNode( node, target, anchor ) {
	target.insertBefore( node, anchor );
}

function appendNode( node, target ) {
	target.appendChild( node );
}

function createText( data ) {
	return document.createTextNode( data );
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

return AnalogClock;

}());