'use strict';

const fs = require( 'fs' );
const httpstatuses = require( 'httpstatuses' );
const micro = require( 'micro' );
const path = require( 'path' );

const api = require( 'fs-router' )( path.join( process.cwd(), 'api' ) );

console.log( `NODE_ENV: ${ process.env.NODE_ENV }` );

// INIT
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

// TASKS
( async function() {
    const tasks_dir = path.join( process.cwd(), 'tasks' );

    if ( !fs.existsSync( tasks_dir ) ) {
        return;
    }

    const require_dir = require( 'require-dir' );
    const tasks = require_dir( tasks_dir );
    
    async function execute_task( task, task_name = 'unknown' ) {
        console.log( `TASKS: Executing: ${ task.name || task_name }` );
        await task.process();

        if ( task.FREQUENCY ) {
            setTimeout( execute_task.bind( null, task, task_name ), task.FREQUENCY );
        }
    }
    
    Object.keys( tasks ).forEach( task_name => {
        const task = tasks[ task_name ];

        if ( task.FREQUENCY ) {
            console.log( `TASKS: Scheduling: ${ task.name || task_name }` );
            setTimeout( async () => {
                await execute_task( task, task_name );
            }, task.INITIAL ? 0 : task.FREQUENCY );
        }
        else {
            // just execute if there's no frequency
            setTimeout( async () => {
                await execute_task( task, task_name );
            }, 0 );
        }
    } );
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