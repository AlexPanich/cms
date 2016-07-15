var elixir = require('laravel-elixir');

/*
 |--------------------------------------------------------------------------
 | Elixir Asset Management
 |--------------------------------------------------------------------------
 |
 | Elixir provides a clean, fluent API for defining some basic Gulp tasks
 | for your Laravel application. By default, we are compiling the Sass
 | file for our application, as well as publishing vendor resources.
 |
 */

elixir(function(mix) {
    mix.copy('bower_components/bootstrap/dist/css/bootstrap.min.css', 'resources/assets/css/')
        .copy('bower_components/jquery/dist/jquery.min.js', 'resources/assets/js')
        .copy('bower_components/bootstrap/dist/js/bootstrap.min.js', 'resources/assets/js/')
        .sass('dashboard.scss', 'resources/assets/css/')
        .styles([
            'dashboard.css'
        ], 'public/css/dashboard.css')
        .scripts([
            'jquery.min.js',
            'bootstrap.min.js'
        ], 'public/js/dashboard.js');
    mix.styles([

        ])
        .sass('app.scss');
});
