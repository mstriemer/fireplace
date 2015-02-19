define('init',
    ['core/cache', 'core/init', 'core/log', 'rewriters', 'routes', 'settings_app',
     'settings_local'],
    function(cache, init, log, rewriters, routes, settingsApp, settingsLocal) {

    log('init').log('ready');

    rewriters.forEach(function(rewriter) {
        cache.addRewriter(rewriter);
    });

    // Put any code that needs to run to initialize the app here or in the
    // dependencies.
});
