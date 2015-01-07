// Do this last- initialize the marketplace!
console.log('Mozilla(R) FP-MKT (R) 1.0');
console.log('   (C)Copyright Mozilla Corp 1998-2014');
console.log('');
console.log('64K High Memory Area is available.');

define(
    'main',
    [
        'underscore',
        'jquery',
        'polyfill', // Must be early.
        'document-register-element',
        'helpers',  // Must come before mostly everything else.
        'helpers_local',
        'apps_buttons',
        'cache',
        'capabilities',
        'consumer_info',
        'compatibility_filtering_select',
        'content-ratings',
        'defer',
        'flipsnap',
        'forms',
        'image-deferrer',
        'l10n',
        'lightbox',
        'log',
        'login',
        'marketplace-elements',
        'models',
        'navbar',
        'navigation',
        'newsletter',
        'overlay',
        'perf_events',
        'perf_helper',
        'previews',
        'ratings',
        'regions',
        'requests',
        'settings',
        'site_config',
        'storage',
        'templates',
        'tracking',
        'tracking_events',
        'urls',
        'user',
        'user_helpers',
        'utils',
        'utils_local',
        'views',
        'webactivities',
        'z'
    ],
function(_) {
    var apps = require('apps');
    var buttons = require('apps_buttons');
    var capabilities = require('capabilities');
    var consumer_info = require('consumer_info');
    var defer = require('defer');
    var flipsnap = require('flipsnap');
    var format = require('format');
    var $ = require('jquery');
    var settings = require('settings');
    var siteConfig = require('site_config');
    var l10n = require('l10n');
    var nunjucks = require('templates');
    var regions = require('regions');
    var storage = require('storage');
    var urls = require('urls');
    var user = require('user');
    var utils = require('utils');
    var utils_local = require('utils_local');
    var z = require('z');

    var console = require('log')('mkt');
    var gettext = l10n.gettext;

    // Use Native Persona, if it's available.
    if (capabilities.firefoxOS && 'mozId' in navigator && navigator.mozId !== null) {
        console.log('Native Persona is available');
        window.navigator.id = navigator.id = navigator.mozId;
    }

    var start_time = performance.now();

    console.log('Dependencies resolved, starting init');

    console.log('Package version: ' + (settings.package_version || 'N/A'));

    // Jank hack because Persona doesn't allow scripts in the doc iframe.
    // Please just delete it when they don't do that anymore.
    // Note: If this list changes - please change it in webpay too or let #payments know.
    var doc_langs = ['cs', 'de', 'el', 'en-US', 'es', 'hr', 'hu', 'it', 'pl', 'pt-BR', 'sr', 'zh-CN'];
    var doc_lang = doc_langs.indexOf(navigator.l10n.language) >= 0 ? navigator.l10n.language : 'en-US';
    var doc_location = urls.media('/docs/{type}/' + doc_lang + '.html?20141001');
    settings.persona_tos = format.format(doc_location, {type: 'terms'});
    settings.persona_privacy = format.format(doc_location, {type: 'privacy'});

    z.body.addClass('html-' + l10n.getDirection());

    if (settings.body_classes) {
        z.body.addClass(settings.body_classes);
    }

    if (!utils_local.isSystemDateRecent()) {
        // System date checking.
        z.body.addClass('error-overlaid')
            .append(nunjucks.env.render('errors/date-error.html'))
            .on('click', '.system-date .try-again', function() {
                if (utils_local.isSystemDateRecent()) {
                    window.location.reload();
                }
            });
    } else {
        utils_local.checkOnline().fail(function() {
            console.log('We are offline. Showing offline message');
            z.body.addClass('error-overlaid')
                .append(nunjucks.env.render('errors/offline-error.html'))
                .on('click', '.offline .try-again', function() {
                    console.log('Re-checking online status');
                    utils_local.checkOnline().done(function(){
                        console.log('Reloading');
                        window.location.reload();
                     }).fail(function() {
                        console.log('Still offline');
                    });
                });
        });
    }

    z.page.one('loaded', function() {
        // Remove the splash screen.
        console.log('Hiding splash screen (' + ((performance.now() - start_time) / 1000).toFixed(6) + 's)');
        var splash = $('#splash-overlay').addClass('hide');
        z.body.removeClass('overlayed').addClass('loaded');

        setTimeout(function() {
            z.page.trigger('splash_removed');
        }, 1500);
    });

    // This lets you refresh within the app by holding down command + R.
    if (capabilities.chromeless) {
        window.addEventListener('keydown', function(e) {
            if (e.keyCode == 82 && e.metaKey) {
                window.location.reload();
            }
        });
    }

    if (capabilities.webApps) {
        // Mark installed apps as such and look for a Marketplace update. If we
        // are in a packaged app, wait for the iframe to be loaded, otherwise
        // we are using the direct installer and we just need to wait for the
        // normal loaded event.
        var event_for_apps = window.location.protocol === 'app:' ? 'iframe-install-loaded' : 'loaded';
        z.page.one(event_for_apps, function() {
            apps.getInstalled().done(function() {
                z.page.trigger('mozapps_got_installed');
                buttons.mark_btns_as_installed();
            });


            var manifest_url = settings.manifest_url;
            // Note: only the iframed app defines a manifestURL for now.
            if (manifest_url) {
                apps.checkForUpdate(manifest_url).done(function(result) {
                    if (result) {
                        z.body.on('click', '#marketplace-update-banner a.download-button', utils._pd(function() {
                            var $button = $(this);
                            // Deactivate "remember" on the dismiss button so that it'll
                            // show up for the next update if the user clicks on it now
                            // they chose to apply the update.
                            $button.closest('mkt-banner').get(0).dismiss = '';
                            $button.addClass('spin');
                            apps.applyUpdate(manifest_url).done(function() {
                                $('#marketplace-update-banner span').text(gettext(
                                    'The next time you start the Firefox Marketplace app, you’ll see the updated version!'));
                                $button.remove();
                            });
                        }));
                        $('#site-nav').after(nunjucks.env.render('marketplace-update.html'));
                    }
                });
            }
        });

        document.addEventListener('visibilitychange', function() {
            if (!document.hidden) {
                // Refresh list of installed apps in case user uninstalled apps
                // and switched back.
                if (user.logged_in()) {
                    consumer_info.fetch(true);
                }
                apps.getInstalled().done(buttons.mark_btns_as_uninstalled);
            }
        }, false);
    }

    // Do some last minute template compilation.
    z.page.on('reload_chrome', function() {
        console.log('Reloading chrome');
        var user_helpers = require('user_helpers');
        var context = {
            render_newsletter: !storage.getItem('newsletter-completed'),
            user_region: user_helpers.region('restofworld'),
            user_email: user.get_setting('email'),
            user_lang: user_helpers.lang(),
            z: z
        };
        $('#site-header').html(
            nunjucks.env.render('header.html', context));
        $('#site-footer').html(
            nunjucks.env.render('footer.html', context));

        if (!window['incompatibility-banner'] &&
                !navigator.mozApps &&
                !navigator.userAgent.match(/googlebot/i)) {
            console.log('Adding incompatibility banner');
            $('#site-nav').after(nunjucks.env.render('incompatible.html'));
        }

        var logged_in = user.logged_in();

        if (!logged_in) {
            z.body.removeClass('show-recommendations');
        }

        siteConfig.promise.then(function () {
            if (capabilities.nativeFxA() || capabilities.yulelogFxA()) {
                // We might want to style things differently for native FxA users,
                // specifically they should need to log out through settings instead
                // of through Marketplace (hide logout buttons for bug 1073177).
                // Unfortunately we need to wait for the switches to load.
                z.body.addClass('native-fxa');
            }

            var banner = document.getElementById('fx-accounts-banner');
            if (banner) {
                banner.dismissBanner();
            }
            if (user.canMigrate()) {
                $('#site-nav').after(
                    nunjucks.env.render('fx-accounts-banner.html',
                                        {logged_in: logged_in}));
            }
        });

        // TODO: Move this to the consumer-info callback when the waffle is
        // removed as we no longer require siteConfig for the waffle switch.
        $.when(siteConfig, consumer_info).then(function() {
            // To show or not to show the recommendations nav.
            if (logged_in && user.get_setting('enable_recommendations') &&
                    // TODO: Remove when waffle removed (bug 1083942).
                    settings.switches.indexOf('recommendations') !== -1) {
                z.body.addClass('show-recommendations');
            }
        });

        consumer_info.promise.then(function() {
            // Re-render footer region if necessary.
            var current_region = user_helpers.region('restofworld');
            if (current_region !== context.user_region) {
                console.log('Region has changed from ' + context.user_region +
                            ' to ' + current_region + ' since we rendered ' +
                            'the footer, updating region in footer.');
                $('#site-footer span.region')
                    .removeClass('region-' + context.user_region)
                    .addClass('region-' + current_region)
                    .text(regions.REGION_CHOICES_SLUG[current_region]);
            }
        });

        z.body.toggleClass('logged-in', logged_in);
        z.page.trigger('reloaded_chrome');
    }).trigger('reload_chrome');

    z.page.on('before_login before_logout', function() {
        require('cache').purge();
    });

    z.body.on('click', '.site-header .back', function(e) {
        e.preventDefault();
        console.log('← button pressed');
        require('navigation').back();
    });

    var ImageDeferrer = require('image-deferrer');
    var iconDeferrer = ImageDeferrer.Deferrer(100, null);
    var screenshotDeferrer = ImageDeferrer.Deferrer(null, 200);
    z.page.one('loaded', function() {
        iconDeferrer.setImages($('.icon.deferred'));
        screenshotDeferrer.setImages($('.screenshot .deferred, .deferred-background'));
    }).on('loaded loaded_more navigate fragment_loaded', function() {
        iconDeferrer.refresh();
        screenshotDeferrer.refresh();
    });
    require('nunjucks').require('globals').imgAlreadyDeferred = function(src) {
        /*
            If an image already has been loaded, we use this helper in case the
            view is triggered to be rebuilt. When pages are rebuilt, we don't
            mark images to be deferred if they have already been loaded.
            This fixes images flashing back to the placeholder image when
            switching between the New and Popular tabs on the home page.
        */
        var iconsLoaded = iconDeferrer.getSrcsAlreadyLoaded();
        var screenshotsLoaded = screenshotDeferrer.getSrcsAlreadyLoaded();
        var loaded = iconsLoaded.concat(screenshotsLoaded);
        return loaded.indexOf(src) !== -1;
    };

    window.addEventListener(
        'resize',
        _.debounce(function() {z.doc.trigger('saferesize');}, 200),
        false
    );

    consumer_info.promise.done(function() {
        console.log('Triggering initial navigation');
        if (!z.spaceheater) {
            z.page.trigger('navigate', [window.location.pathname + window.location.search]);
        } else {
            z.page.trigger('loaded');
        }
    });

    require('requests').on('deprecated', function() {
        // Divert the user to the deprecated view.
        z.page.trigger('divert', [urls.reverse('deprecated')]);
        throw new Error('Cancel navigation; deprecated client');
    });

    var desktopPromo = document.querySelector('.desktop-promo-items');
    var promoItems = Array.prototype.slice.call(desktopPromo.children);
    var placeholderItems = promoItems.map(function(item) {
        var placeholder = item.cloneNode();
        placeholder.innerHTML = item.innerHTML;
        placeholder.classList.add('desktop-promo-placeholder-item');
        desktopPromo.appendChild(placeholder);
        return placeholder;
    });

    function setPromoItemsOrder() {
        promoItems.forEach(function (placeholderItem, i) {
            placeholderItem.style.order = i;
        });
    }

    function showPlaceholder(placeholder, position) {
        placeholder.classList.add('desktop-promo-placeholder-item-shown');
        var placeholderIndex = position ===  'right' ? promoItems.length : -1;
        placeholder.style.order = placeholderIndex;
    }

    function hidePlaceholder(placeholder) {
        // Remove the placeholder.
        placeholder.classList.remove('desktop-promo-placeholder-item-shown');
    }

    function setItemsOffset(position) {
        desktopPromo.setAttribute('data-action', position);
    }

    function animateItemsOffset(position) {
        if (['left', 'center'].indexOf(position) === -1) {
            console.error('animating non animated promo offset');
        }

        var transitionDone = defer.Deferred();
        setItemsOffset(position);
        afterTransition(function () {
            transitionDone.resolve();
        });
        return transitionDone.promise();
    }

    function afterTransition(callback) {
        // Hide the placeholder after the transition ends.
        desktopPromo.addEventListener('transitionend', function animationDone() {
            callback();
            // Remove this event listener.
            desktopPromo.removeEventListener('transitionend', animationDone);
        });
    }

    function waitForRedraw(callback) {
        // Wait for the second animation frame because Firefox seems to perform
        // the first request in the same cycle.
        requestAnimationFrame(function () {
            requestAnimationFrame(callback);
        });
    }

    function shiftRight() {
        // Cycle the promo items.
        var wrappingItem = promoItems.pop();
        promoItems.unshift(wrappingItem);

        // Cycle the placeholder items.
        var placeholder = placeholderItems.pop();
        placeholderItems.unshift(placeholder);

        setPromoItemsOrder();
        showPlaceholder(placeholder, 'right');
        setItemsOffset('right');

        waitForRedraw(function () {
            animateItemsOffset('center').then(function () {
                hidePlaceholder(placeholder);
                setItemsOffset('start');
            });
        });
    }

    function shiftLeft() {
        // Cycle the promo items.
        var wrappingItem = promoItems.shift();
        promoItems.push(wrappingItem);

        // Cycle the placeholder items.
        var placeholder = placeholderItems.shift();
        placeholderItems.push(placeholder);

        setPromoItemsOrder();
        showPlaceholder(placeholder, 'left');
        animateItemsOffset('left').then(function () {
            setItemsOffset('start');
            hidePlaceholder(placeholder);
        });
    }

    $('.desktop-promo-nav-left').on('click', shiftRight);
    $('.desktop-promo-nav-right').on('click', shiftLeft);

    console.log('Initialization complete');
});
