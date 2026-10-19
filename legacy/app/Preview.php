<?php

namespace App;

use File;

class Preview extends BaseImage
{
    protected static $baseDir = 'images/preview';

    protected static $thumbnailDir = 'images/preview/thumbnail';

    protected static $thumbnailSize = '200';

    public function article()
    {
        return $this->belongsTo(Article::class);
    }

    public function clearImage()
    {
        File::delete($this->getPath());
        File::delete($this->getThumbnailPath());
    }


}
