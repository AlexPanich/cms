<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Page extends Model implements SimpleEditInterface
{
    use SimpleEditTrait;

    protected $fillable = [
        'url', 'full_url', 'parent_id', 'title', 'title_in_menu', 'keywords',
        'description', 'is_show', 'menu_id', 'content', 'template_id'
    ];


    public static function boot()
    {
        parent::boot(); // TODO: Change the autogenerated stub

        static::updated(function ($page) {
            static::changeUrl($page['id']);
        });

        static::saving(function ($page) {
            if ($page['id'] == $page['parent_id']) {
                return false;
            }
        });
    }


    public static function create(array $attributes = [])
    {
        $attributes['is_show'] = isset($attributes['is_show']) ? 1 : 0;
        $attributes['full_url'] = static::makeFullUrl($attributes['parent_id'], $attributes['url']);
        return parent::create($attributes);
    }

    public function update(array $attributes = [], array $options = [])
    {
        $attributes['is_show'] = isset($attributes['is_show']) ? 1 : 0;
        $attributes['full_url'] = static::makeFullUrl($attributes['parent_id'], $attributes['url']);
        if (!empty($attributes['pages'])) {
            $pages_id = explode(',', $attributes['pages']);

            $i = 0;
            foreach ($pages_id as $id) {
                self::where('id', $id)->update(['children_sort' => $i++]);
            }
        }
        return parent::update($attributes, $options);
    }


    private static function makeFullUrl($parent_id, $url)
    {
        if ($parent_id == 0) {
            return $url;
        }

        $parent_page = Page::find($parent_id);
        return $parent_page['full_url'] . '/' . $url;
    }

    public static function getTree($start_level = 0)
    {
        $tree = [];
        $pages = self::where('parent_id', $start_level)->orderBy('children_sort', 'asc')->get();

        if (!empty($pages)) {
            foreach ($pages as $page) {
                $page['children'] = self::getTree($page['id']);
                $tree[] = $page;
            }
        }

        return $tree;
    }

    private static function changeUrl($parent_id)
    {
        $children = static::where('parent_id', $parent_id)->get();

        foreach ($children as $child) {
            $child['full_url'] = static::makeFullUrl($child['parent_id'], $child['url']);
            $child->update($child->toArray());
        }
    }

    public function menus()
    {
        return $this->belongsToMany(Menu::class)->withPivot('sort')->withTimestamps();;
    }

    public function menu()
    {
        return $this->belongsTo(Menu::class);
    }

    public function getByParent()
    {
        return self::where('parent_id', $this->parent_id)->orderBy('children_sort', 'asc')->get();
    }

    public function getChildren()
    {
        return self::where('parent_id', $this->id)->orderBy('children_sort', 'asc')->get();
    }

    public function template()
    {
        return $this->belongsTo(Template::class);
    }


}
