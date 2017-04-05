var DummyImg = (function () { 'use strict';

var template = (function () {
return {
  data() {
    return {
      src: 'data:iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='
    };
  },
  oncreate() {
    const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
    const width = this.get('width'), height = this.get('height');
    canvas.width = width;
    canvas.height = height;
    this.set({
      width: width,
      height: height
    });

    const x = width / 2, y = height / 2;
    const text = width + ' x ' + height + '';

    const userAgent = window.navigator.userAgent.toLowerCase();
    let font = '"-apple-system", "Helvetica Neue", "Yu Gothic", YuGothic, Verdana, Meiryo, "M+ 1p", sans-serif';
    if (userAgent.match(/msie|trident/)) {
      const ieVersion = userAgent.match(/(?:msie\s|rv:)([\d\.]+)/)[1];
      if (parseInt(ieVersion, 10) >= 10) font = 'Verdana, Meiryo, sans-serif';
    }


    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = "18px " + font;

    ctx.fillStyle = '#b3b3b3';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#336';
    ctx.fillText(text, x, y);

    if (canvas.toBlob) {
      canvas.toBlob(blob => {
        const imageURL = URL.createObjectURL(blob);
        this.set({src: imageURL});
      });
    } else if (canvas.msToBlob) {
      const blob = canvas.msToBlob();
      const imageURL = URL.createObjectURL(blob);
      this.set({src: imageURL});
    } else {
      const imageURL = canvas.toDataURL();
      this.set({src: imageURL});
    }
  }
};
}());

var addedCss = false;
function addCss () {
	var style = createElement( 'style' );
	style.textContent = "\n@font-face{font-family:\"Yu Gothic\";src:local(\"Yu Gothic Medium\");font-weight:100}\n@font-face{font-family:\"Yu Gothic\";src:local(\"Yu Gothic Medium\");font-weight:200}\n@font-face{font-family:\"Yu Gothic\";src:local(\"Yu Gothic Medium\");font-weight:300}\n@font-face{font-family:\"Yu Gothic\";src:local(\"Yu Gothic Medium\");font-weight:400}\n@font-face{font-family:\"Yu Gothic\";src:local(\"Yu Gothic Bold\");font-weight:bold}\n@font-face{font-family:\"Helvetica Neue\";src:local(\"Helvetica Neue Regular\");font-weight:100}\n@font-face{font-family:\"Helvetica Neue\";src:local(\"Helvetica Neue Regular\");font-weight:200}\n";
	appendNode( style, document.head );

	addedCss = true;
}

function renderMainFragment ( root, component ) {
	var img = createElement( 'img' );
	setAttribute( img, 'svelte-3668883727', '' );
	var last_img_src = root.src;
	img.src = last_img_src;
	var last_img_width = root.width;
	img.width = last_img_width;
	var last_img_height = root.height;
	img.height = last_img_height;

	return {
		mount: function ( target, anchor ) {
			insertNode( img, target, anchor );
		},
		
		update: function ( changed, root ) {
			var __tmp;
		
			if ( ( __tmp = root.src ) !== last_img_src ) {
				last_img_src = __tmp;
				img.src = last_img_src;
			}
			
			if ( ( __tmp = root.width ) !== last_img_width ) {
				last_img_width = __tmp;
				img.width = last_img_width;
			}
			
			if ( ( __tmp = root.height ) !== last_img_height ) {
				last_img_height = __tmp;
				img.height = last_img_height;
			}
		},
		
		teardown: function ( detach ) {
			if ( detach ) {
				detachNode( img );
			}
		}
	};
}

function DummyImg ( options ) {
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
	if ( !addedCss ) addCss();
	
	this._fragment = renderMainFragment( this._state, this );
	if ( options.target ) this._fragment.mount( options.target, null );
	
	if ( options._root ) {
		options._root._renderHooks.push({ fn: template.oncreate, context: this });
	} else {
		template.oncreate.call( this );
	}
}

DummyImg.prototype.get = get;
DummyImg.prototype.fire = fire;
DummyImg.prototype.observe = observe;
DummyImg.prototype.on = on;
DummyImg.prototype.set = set;
DummyImg.prototype._flush = _flush;

DummyImg.prototype._set = function _set ( newState ) {
	var oldState = this._state;
	this._state = Object.assign( {}, oldState, newState );
	
	dispatchObservers( this, this._observers.pre, newState, oldState );
	if ( this._fragment ) this._fragment.update( newState, this._state );
	dispatchObservers( this, this._observers.post, newState, oldState );
};

DummyImg.prototype.teardown = DummyImg.prototype.destroy = function destroy ( detach ) {
	this.fire( 'destroy' );

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

function appendNode( node, target ) {
	target.appendChild( node );
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

return DummyImg;

}());