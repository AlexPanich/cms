<?php

namespace App\Widgets;

use Arrilot\Widgets\AbstractWidget;

class Gallery extends AbstractWidget
{
    /**
     * The configuration array.
     *
     * @var array
     */
    protected $config = [];

    /**
     * Treat this method as a controller action.
     * Return view() or other content to display.
     */
    public function run($name)
    {

        $gallery = \App\Gallery::where('name', $name)->first();

        if (is_null($gallery)) {
            return '';
        }

        return view("widgets.gallery", [
            'config' => $this->config,
            'gallery' => $gallery
        ])->render();
    }
}