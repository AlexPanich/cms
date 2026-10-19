<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Menu extends Model implements SimpleEditInterface
{
    use SimpleEditTrait;

    protected $fillable = [
        'title'
    ];

    public static function getTopMenu()
    {
        return Page::where('parent_id', '0')->get();
    }

    public function pages()
    {
        return $this->belongsToMany(Page::class)->withPivot('sort')->withTimestamps();
    }

    public function withPages()
    {
        return $this->pages()->orderBy('sort', 'asc')->get();
    }

    public function sorting($pages_id)
    {
        $pages_id = explode(',', $pages_id);

        $i = 0;
        foreach ($pages_id as $id) {
            $this->pages()->updateExistingPivot($id, ['sort' => $i++]);
        }

        return true;
    }

}