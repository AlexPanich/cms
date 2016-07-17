<?php

namespace App;

use App\Helpers\Session;
use Illuminate\Database\Eloquent\Model;
use File;

class Document extends Model
{
    protected $fillable = [
       'title', 'path', 'type'
    ];

    public static function boot()
    {
        parent::boot();

        static::deleted(function($document) {
            if (file_exists($document->getPath())) {
                File::delete($document->getPath());
            }
        });
    }

    public static function create(array $attributes = [])
    {
        $array = explode('.', $attributes['path']);

        $attributes['type'] = end($array);

        return parent::create($attributes);
    }

    public function getPath()
    {
        return public_path('documents') . DIRECTORY_SEPARATOR . $this->path;
    }

}
