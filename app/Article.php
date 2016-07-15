<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Article extends Model implements SimpleEditInterface
{
    use SimpleEditTrait;

    protected $fillable = [
        'title', 'text'
    ];

    public static function boot()
    {
        parent::boot();

        static::deleting(function ($article) {
            return $article->preview->clearImage();
        });
    }

    public static function create(array $attributes = [])
    {
        $preview = Preview::FromFile($attributes['preview']);

        $article = parent::create($attributes);

        $article->preview()->save($preview);

        return $article;
    }

    public function preview()
    {
        return $this->hasOne(Preview::class);
    }

    public function update(array $attributes = [], array $options = [])
    {
        if (isset($attributes['preview'])) {
            $this->preview->delete();
            $preview = Preview::FromFile($attributes['preview']);
            if ( parent::update($attributes, $options) ) {
                $this->preview()->save($preview);
                return true;
            }
            return false;
        }

        return parent::update($attributes, $options);

    }


}
