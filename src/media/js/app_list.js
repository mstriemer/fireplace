define('app_list',
    ['core/capabilities', 'core/storage', 'tracking', 'core/utils', 'core/z'],
    function(caps, storage, tracking, utils, z) {
    'use strict';

    // If we've set this value in localStorage before, then always use it.
    var expand = !!storage.getItem('expand-listings');

    function initTileState() {
        // Handle tile expanded state and populate preview thumbs.
        // Preserve the tile expand state in localStorage.
        $('.app-list').toggleClass('expanded', expand);
        $('.app-list-filters-expand-toggle')
            .toggleClass('active', expand)
            .addClass('show');
        storage.setItem('expand-listings', !!expand);
        if (expand) {
            z.page.trigger('populatetray');
            // Set the `src` for hidden images so they get loaded.
            $('.mkt-tile img[data-src]:not([src])').each(function() {
                this.src = this.getAttribute('data-src');
            });
        }
    }

    z.body.on('click', '.app-list-filters-expand-toggle', utils._pd(function() {
        expand = !expand;
        initTileState();
        z.doc.trigger('scroll');  // For defer image loading.
    }));

    z.page.on('loaded reloaded_chrome', function() {
        // On load - set the tile expand state on available app lists.
        if ($('.main:not(.feed-landing-apps) .app-list').length) {
            initTileState();
        }
        $('.app-list').addClass('show-app-list');
    }).on('loaded_more', function() {
        // Remove paginated class from app lists if .loadmore goes away.
        if (!$('.loadmore').length) {
            $('.app-list').removeClass('paginated');
        }
    });
});
