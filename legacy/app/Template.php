<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Template extends Model
{
    protected $fillable = [
        'name', 'path'
    ];

    public static function getFileNames()
    {
        return array_slice(scandir(resource_path('/views/templates')), 2);
    }

    public function pages()
    {
        return $this->hasMany(Page::class);
    }

    public function getSlug()
    {
        return explode('.', $this->path)[0];
    }
}
