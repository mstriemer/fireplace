define('newsletter',
    ['capabilities', 'jquery', 'notification', 'nunjucks', 'requests', 'storage', 'urls', 'user', 'user_helpers', 'utils', 'z'],
    function(capabilities, $, notification, nunjucks, requests, storage, urls, user, user_helpers, utils, z) {
    'use strict';

    function expandDetails($details) {
        if (!$details.hasClass('expanded')) {
            $details
                .addClass('expanding')
                .removeClass('collapsed')
                .one('transitionend', function() {
                    $details.addClass('expanded');
                });
            setTimeout(function() {
                $details.removeClass('expanding');
            }, 1);
        }
    }

    z.page.on('click', '.account-settings .newsletter-signup', function(e) {
        if (capabilities.widescreen()) {
            e.preventDefault();
            e.stopPropagation();
            var footer = $('<div id="newsletter-footer"></div>');
            footer.html(nunjucks.env.render('newsletter.html', {
                user_region: user_helpers.region('restofworld'),
                user_email: user.get_setting('email'),
                user_lang: user_helpers.lang(),
            }));
            $('#newsletter-footer').remove();
            $('#site-footer').prepend(footer);
            $('#newsletter-footer .email').focus();
            window.scrollTo(footer.offset());
        }
    });

    z.body.on('focus', '#newsletter-footer .email', function() {
        expandDetails($(this).siblings('.newsletter-details'));
    }).on('click', '.newsletter-signup-button', function() {
        expandDetails($(this).closest('form').find('.newsletter-details'));
    }).on('submit', '.newsletter form', utils._pd(function() {
        var $form = $(this);
        var $success = $form.siblings('.success');
        var $processing = $form.siblings('.processing');
        var data = utils.getVars($form.serialize());

        data.newsletter = 'marketplace-' + capabilities.device_platform();

        $form.addClass('processing-hidden');
        $processing.show();

        requests.post(urls.api.url('newsletter'), data).done(function() {
            $form.remove();
            $processing.remove();
            $success.show();
            storage.setItem('newsletter-completed', true);
            z.win.one('navigating', function() {
                $('#newsletter-footer').remove();
            });
        }).fail(function() {
            $processing.remove();
            $form.removeClass('processing-hidden');
            notification.notification({message: gettext('There was an error submitting your newsletter sign up request')});
        });
    }));
});
