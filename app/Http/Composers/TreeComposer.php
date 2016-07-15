<?php

namespace App\Http\Composers;


use App\Article;
use App\Page;
use Illuminate\Contracts\View\View;

class TreeComposer
{
    public function compose(View $view)
    {
        $view->with('tree', Page::getTree());
    }
}