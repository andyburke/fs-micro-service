'use strict';

const fs = require( 'fs' );
const httpstatuses = require( 'httpstatuses' );
const micro = require( 'micro' );
const path = require( 'path' );

const api = require( 'fs-router' )( path.join( process.cwd(), 'api' ) );

( async function() {
    const init_filename = path.join( process.cwd(), 'init.js' );

    if ( !fs.existsSync( init_filename ) ) {
        return;
    }

    const init = require( init_filename );

    if ( typeof init === 'function' ) {
        await init();
    }
    else if ( typeof init.init === 'function' ) {
        await init.init();
    }
} )();

module.exports = async function( request, response ) {
    const handler = api( request );

    if ( !handler ) {
        micro.send( response, httpstatuses.not_found, {
            error: 'not found'
        } );
        return;
    }

    return await handler( request, response );
};