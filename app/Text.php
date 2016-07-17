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

        if (is_null(static::$cache) || !isset(static::$cache[$alias]) || !static::$cache[$alias]->is_show) {
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

    public static function create(array $attributes = [])
    {
        $attributes['is_show'] = isset($attributes['is_show']) ? 1 : 0;

        return parent::create($attributes);
    }

    public function update(array $attributes = [], array $options = [])
    {
        $attributes['is_show'] = isset($attributes['is_show']) ? 1 : 0;

        return parent::update($attributes, $options);
    }
}
