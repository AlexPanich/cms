<?php

namespace App\Widgets;

use Arrilot\Widgets\AbstractWidget;

class ReplaceWidget extends AbstractWidget
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
    public function run($content)
    {
        $pattern = '/\[\[--widget\/(.+?)\/(.+?)--\]\]/';

        $content = preg_replace_callback($pattern, function($matches) {
                    $widgetName = '\\App\\Widgets\\' . ucfirst($matches[1]);
                    $param = $matches[2];
                    return (new $widgetName)->run($param);
                },$content);


        return view("widgets.replace_widget", [
            'config' => $this->config,
            'content' => $content,
        ]);
    }
}