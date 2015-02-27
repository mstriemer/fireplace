/*
    Mock window.navigator.mozApps.
    mozApps API return request objects. For our mock, in most cases we will
    call the requests' callbacks instantly via setIntervals.
*/
function initialize() {
    var readyInterval = setInterval(function() {
        // Interval to make sure we initialize only after the window is ready.
        // If we do it too soon, then the window will override our mock with
        // the standard window.navigator.
        if (casper.evaluate(_initialize)) {
            clearInterval(readyInterval);
        }
    }, 50);

    function _initialize(finalRun) {
        if (document.readyState === 'complete' &&
                window.navigator.mozApps.mock) {
            // Seems like we're done, but let's mock it once more.
            if (!finalRun) {
                setTimeout(function() {
                    _initialize(true);
                }, 100);
            } else {
                console.log('[mozApps] Mock mozApps initialized');
            }
            return true;
        }
        // Keep track of installed apps.
        var manifests = [];

        window.navigator.mozApps = {
            // Mock app installs.
            getInstalled: function() {
                var request = {
                    result: manifests.map(function(manifest) {
                        return {
                            manifestURL: manifest,
                            launch: function() {
                                console.log('[mozApps] Launching ' + manifest);
                            }
                        };
                    })
                };

                setTimeout(function() {
                    if (window._.isFunction(request.onsuccess)) {
                        console.log('[mozApps] Calling request.onsuccess');
                        request.onsuccess();
                    } else {
                        console.log('[mozApps] Not calling request.onsuccess');
                        console.log(request.onsuccess);
                    }
                });

                return request;
            },
            getSelf: function() {
                var request = {};

                setTimeout(function() {
                    if (window._.isFunction(request.onsuccess)) {
                        console.log('[mozApps] Calling request.onsuccess');
                        request.onsuccess();
                    } else {
                        console.log('[mozApps] Not calling request.onsuccess');
                        console.log(request.onsuccess);
                    }
                });

                return request;
            },
            install: function(manifest) {
                console.log('[mozApps] Installing app');
                console.log(manifest);
                var request = {
                    result: {
                        installState: 'installed',
                        ondownloaderror: function() {
                            // If you want to mock a download error.
                        }
                    },
                    onerror: function() {
                        // If you want to mock a request error.
                    }
                };

                setTimeout(function() {
                    if (window._.isFunction(request.onsuccess)) {
                        console.log('[mozApps] Calling request.onsuccess');
                        request.onsuccess();
                    } else {
                        console.log('[mozApps] Not calling request.onsuccess');
                        console.log(request.onsuccess);
                    }
                });

                manifests.push(manifest);

                return request;
            },
        };

        window.navigator.mozApps.installPackage = window.navigator.mozApps.install;
        window.navigator.mozApps.mock = true;
        console.log('[mozApps] Mock mozApps mocked');

        // Keep mocking it until it won't get overriden.
        return false;
    }
}

module.exports = {
    initialize: initialize
};
