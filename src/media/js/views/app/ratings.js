define('views/app/ratings', ['l10n', 'requests', 'storage', 'urls', 'user_helpers'],
       function(l10n, requests, storage, urls, user_helpers) {
    'use strict';

    var gettext = l10n.gettext;

    return function(builder, args) {
        var slug = args[0];

        function matchLang() {
            return storage.getItem('match_review_lang');
         }

        function renderTemplate(template, context) {
            $('.rating-list').html(builder.env.render(template, context));
        }

        builder.start('ratings/main.html', {
            'slug': slug,
            'match_lang': matchLang(),
        });

        $('#page').on('change', '.match-rating-lang', function(e) {
            storage.setItem('match_review_lang', e.target.value);
            // Update the other elements that are displaying this data.
            $('.match-rating-lang').each(function(i, el) {
              el.value = e.target.value;
            });
            var url = urls.api.params('reviews', {
                app: slug,
                match_lang: matchLang(),
            });
            renderTemplate('ratings/spinner.html');
            requests.get(url).then(function(response) {
                var context = {response: response};
                if (response.objects.length > 0) {
                    renderTemplate('ratings/ratings.html', context);
                } else {
                    renderTemplate('ratings/no_ratings.html', context);
                }
            }, function(error) {
                console.error('Error fetching ratings', error);
            });
        });

        builder.z('type', 'leaf');
        builder.z('parent', urls.reverse('app', [slug]));
        // L10n: The title for the list of reviews
        builder.z('title', gettext('Reviews'));
    };
});
