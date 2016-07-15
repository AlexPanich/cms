<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Text extends Model implements SimpleEditInterface
{
    use SimpleEditTrait;

    protected $fillable = [
        'alias', 'title', 'body', 'is_show'
    ];

    private static $cache;

    public static function getByAlias($alias)
    {
        if(static::$cache == null)
            static::load_texts();

        if (is_null(static::$cache)) {
            return (new static);
        }

        return static::$cache[$alias];
    }

    public static function load_texts()
    {
        $texts = static::all();

        foreach($texts as $text)
            static::$cache[$text['alias']] = $text;
    }
}
