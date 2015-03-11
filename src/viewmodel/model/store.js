import { isEqual } from 'utils/is';
import createBranch from 'utils/createBranch';

var hasChild = function ( value, key ) {
	if ( value == null ) {
		return false;
	}
	if ( ( typeof value === 'object' || typeof value === 'function' ) && !( key in value ) ) {
		return false;
	}
	return true;
}

export class DataStore {

	constructor ( data ) {
		this.data = data;
	}

	get () {
		return this.data;
	}

	getSettable () {
		var value = this.get();

		if ( !value ) {
			// silent set directly on store
			this.set( value = {} );
		}

		return value;
	}

	set ( value ) {
		if ( isEqual( this.get(), value ) ) {
			return false;
		}
		this.data = value;
		return true;
	}

	invalidate () {

	}
}

export class PropertyStore {

	constructor ( property, model ) {
		this.model = model;
		this.property = property;
	}

	get () {
		var value = this.model.parent.get();
		if( hasChild( value, this.property ) ) {
			return value[ this.property ];
		}
		// FAILED_LOOKUP
	}

	getSettable ( propertyOrIndex ) {
		var value = this.get();

		if ( !value ) {
			// set value as {} or []
			value = createBranch( propertyOrIndex );
			// silent set
			this.set( value );
		}

		return value;
	}

	set ( value ) {
		if ( isEqual( this.get(), value ) ) {
			return false;
		}

		this.model.parent.store.getSettable( this.property )[ this.property ] = value;

		return true;
	}

	invalidate () {

	}
}

export class StateStore {

	constructor ( state ){
		this.state = state;
	}

	get () {
		return this.state;
	}

	getSettable () {
		// TODO Should be allowed once we allow object state
		throw new Error('uh, shouldn\'t get value of an state store as a parent');
	}

	set ( state ) {

		// TODO Reevaluate after rebinds done
		throw new Error('uh, shouldn\'t set value of an state store');

		if ( isEqual( this.get(), state ) ) {
			return false;
		}

		this.state = state;

		return true;
	}

	invalidate () {

	}
}


export class ReferenceStore {

	constructor ( reference, parent ) {
		this.parent = parent;
		this.reference = reference;
		this.resolved = null;
	}

	get () {
		var value;
		if ( !this.resolved && typeof ( value = this.reference.get() ) !== 'undefined' ) {
			this.resolved = this.parent.join( value );
		}
		return this.resolved ? this.resolved.get() : void 0;
	}

	getSettable ( propertyOrIndex ) {
		throw new Error('ReferenceStore should not have getSettable called.');
	}

	set ( value ) {
		if ( !this.resolved ) {
			if ( typeof value !== 'undefined' ) {
				throw new Error('ReferenceStore set called without resolved.');
			}
			return;
		}

		this.resolved.set( value );
		return this.resolved.dirty;
	}

	invalidate () {
		this.resolved = null;

		this.value = this.reference.get();

		if ( this.value != null ) {
			this.realModel = this.parent.join( this.value );
		} else {
			this.realModel = null
		}
	}
}


export class ExpressionStore {

	constructor ( computation ) {
		this.computation = computation;
	}

	get () {
		return this.computation.get();
	}

	getSettable ( propertyOrIndex ) {
		var value = this.get();

		if ( !value ) {
			// What to do here? And will we even be here?
			throw new Error('Setting a child of non-existant parent expression');
		}

		return value;
	}

	set ( value ) {
		if ( isEqual( this.get(), value ) ) {
			return false;
		}

		this.computation.set( value );

		return true;
	}

	invalidate () {
		this.computation.invalidate();
	}
}
