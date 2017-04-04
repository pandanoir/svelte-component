var DateComponent = (function () { 'use strict';

var template = (function () {
return {
  oncreate() {
    const monthName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const year = new Date().getFullYear();
    const month = new Date().getMonth();
    const date = new Date().getDate();
    const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
    const format = this.get('format');
    const zerofill = (n, m) => '0'.repeat(Math.max(n - `${m}`.length, 0)) + m;
    let res = '';
    for (let i = 0, _i = format.length; i < _i; i++) {
      const s = format.charAt(i);
      if (s === '\\') {i++; res += format.charAt(i); continue;}
      else if (s === 'd') {
        let n = 0;
        while (format.charAt(i + n) === 'd') n++;
        if (n >= 3) throw new Error('Too many pattern letters: d');
        if (n <= 2) res += zerofill(n, date);
        i += n - 1;
      } else if (s === 'E') {
        let n = 0;
        while (format.charAt(i + n) === 'E') n++;
        if (n >= 6) throw new Error('Too many pattern letters: E');
        if (n === 5) res += day.charAt(0);
        if (n === 4) res += day;
        if (n <= 3) res += day.slice(0, 3);
        i += n - 1;
      } else if (s === 'M') {
        let n = 0;
        while (format.charAt(i + n) === 'M') n++;
        if (n >= 6) throw new Error('Too many pattern letters: M');
        if (n === 5) res += monthName[month].charAt(0);
        if (n === 4) res += monthName[month];
        if (n === 3) res += monthName[month].slice(0, 3);
        if (n <= 2) res += zerofill(n, month + 1);
        i += n - 1;
      }
      else if (s === 'y') {
        let n = 0;
        while (format.charAt(i + n) === 'y') n++;
        if (n === 2) res += (`${year}`).slice(-2);
        else res += zerofill(n, year);
        i += n - 1;
      }
      else res += s;
    }
    this.set({string: res});
  },
  data() {
    return {
      format: 'yyyy/MM/dd(E)'
    };
  }
};
}());

function renderMainFragment ( root, component ) {
	var span = createElement( 'span' );
	
	var last_text = root.string;
	var text = createText( last_text );
	appendNode( text, span );

	return {
		mount: function ( target, anchor ) {
			insertNode( span, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( ( __tmp = root.string ) !== last_text ) {
				text.data = last_text = __tmp;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( span );
			}
		}
	};
}

function DateComponent ( options ) {
	options = options || {};
	this._state = Object.assign( template.data(), options.data );
	
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

DateComponent.prototype.get = get;
DateComponent.prototype.fire = fire;
DateComponent.prototype.observe = observe;
DateComponent.prototype.on = on;
DateComponent.prototype.set = set;
DateComponent.prototype._flush = _flush;

DateComponent.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

DateComponent.prototype.teardown = DateComponent.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

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

return DateComponent;

}());