define('tests/unit/user_helpers', [
], function() {

    /*
    test('user_helpers carrier', function(done, fail) {
        var initial_args = {};
        var settings = {};
        mock(
            'user_helpers',
            {
                utils: {getVars: function() { return initial_args; }},
                user: {get_setting: function(key) { return settings[key];}}
            },
            function(user_helpers) {
                assert.equal(user_helpers.carrier(), '');

                settings.carrier_override = 'mycarrieroverride';
                settings.carrier_sim = 'mycarriersim';
                assert.equal(user_helpers.carrier(), 'mycarrieroverride');

                delete settings.carrier_override;
                assert.equal(user_helpers.carrier(), 'mycarriersim');

                initial_args.carrier = 'mycarrierinitial';
                assert.equal(user_helpers.carrier(), 'mycarrierinitial');
                done();
            },
            fail
        );
    });

    test('user_helpers region', function(done, fail) {
        var initial_args = {};
        var settings = {};
        mock(
            'user_helpers',
            {
                utils: {getVars: function() { return initial_args; }},
                user: {get_setting: function(key) { return settings[key];}},
            },
            function(user_helpers) {
                assert.equal(user_helpers.region(null, true), '');
                assert.equal(user_helpers.region('defaultregion', true), 'defaultregion');
                assert.equal(user_helpers.region(null, false), '');
                assert.equal(user_helpers.region('defaultregion', false), 'defaultregion');

                settings.region_geoip = 'myregiongeoip';
                assert.equal(user_helpers.region(null, true), '');
                assert.equal(user_helpers.region('defaultregion', true), 'defaultregion');
                assert.equal(user_helpers.region(null, false), 'myregiongeoip');
                assert.equal(user_helpers.region('defaultregion', false), 'myregiongeoip');

                initial_args.region = 'fakeregion';
                assert.equal(user_helpers.region(null, true), '');
                assert.equal(user_helpers.region('defaultregion', true), 'defaultregion');
                assert.equal(user_helpers.region(null, false), 'myregiongeoip');
                assert.equal(user_helpers.region('defaultregion', false), 'myregiongeoip');

                settings.region_sim = 'de';
                assert.equal(user_helpers.region(null, true), 'de');
                assert.equal(user_helpers.region('defaultregion', true), 'de');
                assert.equal(user_helpers.region(null, false), 'de');
                assert.equal(user_helpers.region('defaultregion', false), 'de');

                settings.region_override = 'us';
                assert.equal(user_helpers.region(null, true), 'us');
                assert.equal(user_helpers.region('defaultregion', true), 'us');
                assert.equal(user_helpers.region(null, false), 'us');
                assert.equal(user_helpers.region('defaultregion', false), 'us');

                initial_args.region = 'pl';
                assert.equal(user_helpers.region(null, true), 'pl');
                assert.equal(user_helpers.region('defaultregion', true), 'pl');
                assert.equal(user_helpers.region(null, false), 'pl');
                assert.equal(user_helpers.region('defaultregion', false), 'pl');

                done();
            },
            fail
        );
    });
    */
});
