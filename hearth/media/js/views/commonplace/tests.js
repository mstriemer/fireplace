define('views/tests', ['assert', 'defer', 'requests', 'z'], function(assert, defer, requests, z) {
    return function(builder) {
        var started = 0;
        var passed = 0;
        var failed = 0;
        var tests = [];
        var testScripts = [];
        var config = {};

        function is_done() {
            var ndone = passed + failed;
            var progress = $('progress');
            progress.attr('value', ndone / started);
            if (ndone === started) {
                endTime = new Date();
                var elapsed = (endTime - startTime) / 1000;
                console.log('Tests completed.');
                progress
                    .after($('<span> in ' + elapsed + ' seconds.</span>'))
                    .after($('<b>Completed ' + ndone + ' tests</b>'));
            }
        }

        function loadConfig() {
            var $config = z.body.find('#test-config');
            [['timeout', 5000],
             ['concurrency', 5]].forEach(function (option) {
                var name = option[0];
                var defaultValue = option[1];
                var lsKey = 'test_' + name;
                var $input = $('<input>')
                    .attr('placeholder', name)
                    .attr('id', 'id_' + name)
                    .val(localStorage.getItem(lsKey) || defaultValue)
                    .on('change', function () {
                        localStorage.setItem(lsKey, $input.val());
                    });
                var $label = $('<label>').text(name).attr('for', 'id_' + name);
                $config.append($label).append($input);
                config[name] = $input.val();
            });
        }

        window.test = function(name, runner, cleanup) {
            var infobox = $('<li><span style="background-color: gray">Registered</span> <b>' + name + '</b></li>');
            started++;
            is_done();
            $('ol.tests').append(infobox);
            tests.push(function () {
                var testResult = defer.Deferred();
                var timeout = setTimeout(function () {
                    has_failed('timeout');
                }, config.timeout);
                is_done();
                infobox.find('span').text('Running');
                var completion = function() {
                    clearTimeout(timeout);
                    passed++;
                    $('#c_passed').text(passed);
                    infobox.find('span').text('Passed').css('background-color', 'lime');
                    is_done();
                    if (cleanup) cleanup();
                    testResult.resolve(true);
                };
                var has_failed = function(message) {
                    clearTimeout(timeout);
                    console.error(name, message);
                    failed++;
                    is_done();
                    infobox.find('span').html('Failed<br>' + message).css('background-color', 'pink');
                    $('#c_failed').text(failed);
                    if (cleanup) cleanup();
                    testResult.resolve(false);
                };
                try {
                    console.log('Starting ' + name);
                    infobox.find('span').text('Started').css('background-color', 'goldenrod');
                    runner(completion, has_failed);
                } catch (e) {
                    has_failed(e.message);
                }
                $('#c_started').text(started);
                return testResult;
            });
        };

        builder.start('tests.html');
        var scripts = document.querySelectorAll('#page script');
        function processor(data) {
            /* jshint ignore:start */
            eval(data);
            /* jshint ignore:end */
        }

        for (var i = 0; i < scripts.length; i++) {
            var script = scripts[i];
            testScripts.push(requests.get(script.getAttribute('src'), true)
                       .done(processor));
        }

        builder.z('type', 'debug');
        builder.z('dont_reload_on_login', true);
        builder.z('title', 'Unit Tests');

        defer.when(testScripts).done(function () {
            loadConfig();
            startTime = new Date();
            window.runTests = function runTests() {
                var test = tests.shift();
                if (test) return test().then(runTests, runTests);
                else return require('defer').Deferred().resolve();
            };
            z.page.on('splash_removed', function () {
                for (var i = 0; i < config.concurrency; i++) {
                    runTests();
                }
            });
        });
    };
});
