define('views/app',
    ['capabilities', 'content-ratings', 'l10n', 'log', 'settings', 'storage', 'tracking', 'utils', 'z', 'overflow'],
    function(caps, iarc, l10n, log, settings, storage, tracking, utils, z) {
    'use strict';

    var gettext = l10n.gettext;
    var console = log('app');

    z.page.on('click', '#product-rating-status .toggle', utils._pd(function() {
        // Show/hide scary content-rating disclaimers to developers.
        $(this).closest('.toggle').siblings('div').toggleClass('hidden');

    })).on('click', '.show-toggle', utils._pd(function() {
        var $this = $(this),
            newTxt = $this.attr('data-toggle-text');
        // Toggle "more..." or "less..." text.
        $this.attr('data-toggle-text', $this.text());
        $this.text(newTxt);
        // Toggle description.
        $this.prev('.truncated-wrapper').toggleClass('truncated');

    })).on('click', '.approval-pitch', utils._pd(function() {
        $('#preapproval-shortcut').trigger('submit');

    })).on('click', '.product-details .icon', utils._pd(function(e) {
        // When I click on the icon, append `#id=<id>` to the URL.
        window.location.hash = 'id=' + $('.product').data('id');
        e.stopPropagation();
    }));

    // Init desktop abuse form modal trigger.
    // The modal is responsive even if this handler isn't removed.
    z.page.on('click', '.abuse .button', function(e) {
        if (caps.widescreen()) {
            e.preventDefault();
            e.stopPropagation();
            z.body.trigger('decloak');
            $('.report-abuse.modal').addClass('show');
        }
    });

    return function(builder, args) {
        var slug = args[0];
        builder.start('detail/main.html', {
            iarc: iarc,
            match_lang: storage.getItem('match_review_lang'),
            slug: slug
        });

        // There could be several fragment errors (one for each `defer` block
        // whose `request` failed). So we listen for just the first one and
        // add a one-time-use event listener each time this page is rendered.
        z.page.one('fragment_load_failed', function(e, data) {
            if (data.signature.id === 'app-data') {
                builder.z('title', gettext('Oh no!'));
            }
        });

        // This is fine; tracking_events depends on:
        // navigation > views > views/app
        // This prevents a dependency loop, but all deps should have been
        // resolved by the time this executes.
        require('tracking_events').track_search_term(true);

        builder.z('type', 'leaf detail');
        builder.z('title', gettext('Loading...'));
        builder.z('pagetitle', gettext('App Details'));

        var sync = true;
        builder.onload('app-data', function(app) {
            builder.z('title', utils.translate(app.name));

            z.page.trigger('populatetray');
            require('overflow').init();

            // 'truncated' class is applied by default, remove it if it's not
            // needed.
            $('.truncated-wrapper').each(function() {
                var $this = $(this);
                if ($this.prop('scrollHeight') <= $this.prop('offsetHeight')) {
                    $this.removeClass('truncated').next('.show-toggle').hide();
                }
            });
            if (caps.widescreen() && !$('.report-abuse').length) {
                z.page.append(
                    require('templates').env.render('detail/abuse.html', {slug: slug})
                );
            }

            if (!sync) return;

            if (app) {
                tracking.setPageVar(6, 'App name', app.name, 3);
                tracking.setPageVar(7, 'App ID', app.id + '', 3);
                tracking.setPageVar(8, 'App developer', app.author, 3);
                tracking.setPageVar(9, 'App view source', utils.getVars().src || 'direct', 3);
                tracking.setPageVar(10, 'App price', app.payment_required ? 'paid' : 'free', 3);
            } else {
                console.warn('app object is falsey and is not being tracked');
            }

        }).onload('ratings', function() {
            var reviews = $('.detail .reviews li');
            if (reviews.length >= 3) {
                for (var i = 0; i < reviews.length - 2; i += 2) {
                    var hgt = Math.max(reviews.eq(i).find('.review-inner').height(),
                                       reviews.eq(i + 1).find('.review-inner').height());
                    reviews.eq(i).find('.review-inner').height(hgt);
                    reviews.eq(i + 1).find('.review-inner').height(hgt);
                }
            }
        });
        sync = false;
    };
});
