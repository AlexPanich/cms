<?php

namespace App;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Intervention\Image\Facades\Image as ImageFacade;
use File;


abstract class BaseImage extends Model
{
    protected $file;

    protected static $baseDir = 'images';

    protected static $thumbnailDir = 'images/thumbnail';

    protected static $thumbnailSize = '200';

    protected $fillable = [
        'name'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($image) {
            return $image->upload();
        });
    }

    public static function fromFile(UploadedFile $file)
    {
        $image = new static;

        $image->file = $file;

        return $image->fill([
            'name' => $image->fileName(),
        ]);
    }

    public function fileName()
    {
        $name = sha1(time() . mt_rand(0, 1000) . $this->file->getClientOriginalName());

        $extension = $this->file->getClientOriginalExtension();

        return $name . '.' . $extension;
    }

    public function upload()
    {
        $this->file->move(static::$baseDir, $this->name);

        $this->makeThumbnail();

        return $this;
    }

    protected function makeThumbnail()
    {
        ImageFacade::make($this->getPath())->fit(static::$thumbnailSize)->save($this->getThumbnailPath());
    }

    public function delete()
    {
        File::delete($this->getPath());
        File::delete($this->getThumbnailPath());
        parent::delete();
    }

    public function getPath()
    {
        return public_path() . '/' . static::$baseDir . '/' . $this->name;
    }

    public function getThumbnailPath()
    {
        return public_path() . '/' . static::$thumbnailDir . '/' . $this->name;
    }

    public function getPathAttribute()
    {
        return static::$baseDir . '/' . $this->name;
    }

    public function getThumbnailPathAttribute()
    {
        return static::$thumbnailDir . '/' . $this->name;
    }

}
