<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Gallery extends Model
{
    protected $fillable = [
       'name', 'title'
    ];

    public function addImage(Image $image)
    {
        return $this->images()->save($image);
    }

    public function images()
    {
        return $this->belongsToMany(Image::class)->withPivot('sort')->withTimestamps();
    }

    public function withImage()
    {
        return $this->images()->orderBy('sort', 'asc')->get();
    }

    public function sorting(array $images)
    {
        $i = 0;
        foreach ($images as $id) {
            $this->images()->updateExistingPivot($id, ['sort' => $i++]);
        }

        return true;
    }

    public function delete()
    {
        foreach($this->images as $image) {
            $image->removeFile();
        }
        parent::delete();
    }
}
