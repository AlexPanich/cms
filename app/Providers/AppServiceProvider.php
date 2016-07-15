<?php

namespace App\Providers;

use App\Modules\Search;
use Blade;
use Illuminate\Support\ServiceProvider;
use Exception;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Bootstrap any application services.
     *
     * @return void
     */
    public function boot()
    {
        Blade::directive('tree', function ($expression) {

            $arr = explode(',', str_replace([' ', '(', ')'], '', $expression));
            $tree = $arr[0];
            if (isset($arr[1])) {
                $page_id = $arr[1];
            } else {
                $page_id = 0;
            }

            return "<?php
                         print_tree($tree, $page_id);
                   ?>";
        });

        Blade::directive('menu_tree', function ($expression) {

            try {
                list($tree, $pages) = explode(',', str_replace([' ', '(', ')'], '', $expression));
                if ($pages == '$menu') $pages = 'old(\'pages\', $menu->pages->keyBy(\'id\')->keys()->all())';
            } catch (Exception $e) {
                $pages = 'old(\'pages\')';
            }
            return "<?php
                        print_menu_tree($tree, $pages);
                   ?>";
        });

        Blade::directive('frontWidget', function ($expression) {
            list($type, $one) = explode(',', str_replace([' ', '(', ')'], '', $expression));

            return "<?php
                        if (Auth::check() && Auth::user()->can('edit_from_front')) {
                            echo 'widget-toggle=\"$type\" id_widget_note=\"' . with({$one})->id . '\"';
                        }
                   ?>";
        });

        Blade::directive('frontField', function ($expression) {
            list($key, $type) = explode(',', str_replace([' ', '(', ')'], '', $expression));

            return "<?php
                        if (Auth::check() && Auth::user()->can('edit_from_front')) {
                            echo 'change_key=\"$key\" replace=\"$type\"';
                        }
                    ?>";
        });

        Blade::directive('text', function ($expression) {
            return "<?php

                        \$text = \\App\\Text::getByAlias(str_replace(['(',')'], '', '$expression'));
                        if (Auth::check() && Auth::user()->can('edit_from_front')) {
                           \$text['body'] = '<div widget-toggle=\"text\" id_widget_note=\"' . \$text['id']
                           . '\" style=\"display:inline-block\">'
                           . '<span change_key=\"body\" replace=\"textarea\">'
                           . \$text['body'] . '</span>'
                           . '</div>';
                        }
                        echo \$text['body'];
                    ?>";
        });
    }

    /**
     * Register any application services.
     *
     * @return void
     */
    public function register()
    {
        $this->app->singleton(Search::class, function ($app) {
            return new Search($app->config['search_map']);
        });
    }
}
