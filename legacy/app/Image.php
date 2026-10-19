<?php

namespace App;


class Image extends BaseImage
{
    protected static $baseDir = 'images/gallery';

    protected static $thumbnailDir = 'images/gallery/thumbnail';

    protected static $thumbnailSize = '400';

    public function gallery()
    {
        return $this->belongsToMany(Gallery::class)->withPivot('sort')->withTimestamps();
    }

}
