<?php

namespace App\Providers;

use App\Http\Composers\MenuComposer;
use App\Http\Composers\TreeComposer;
use View;
use Illuminate\Support\ServiceProvider;

class ComposerServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap the application services.
     *
     * @return void
     */
    public function boot()
    {
        View::composer('dashboard.*', TreeComposer::class);
    }

    /**
     * Register the application services.
     *
     * @return void
     */
    public function register()
    {

    }
}
