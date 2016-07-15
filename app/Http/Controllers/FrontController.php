<?php

namespace App\Http\Controllers;

use App\Menu;
use App\Modules\Search;
use App\Page;
use Illuminate\Support\Facades\Request as RequestFacade;
use Illuminate\Http\Request;
use App\Http\Requests;


class FrontController extends Controller
{
    public function __construct()
    {
        $top_menu = Menu::getTopMenu();

        $this->setActiveMenu($top_menu);

        view()->share('top_menu', $top_menu);
    }

    public function index()
    {
        return view('pages.index');
    }

    public function getByUrl(Page $page)
    {
        $menu = $page->menu_id != 0 ? $page->menu->withPages() : $page->getByParent();

        $child_menu = $page->getChildren();

        $this->setActiveMenu($menu);

        $this->setActiveMenu($child_menu);

        return view('pages.page', compact('page', 'menu', 'child_menu'));
    }

    protected function setActiveMenu($menu)
    {
        $path = RequestFacade::path();

        foreach ($menu as &$item) {
            $pattern = '/^' . str_replace('/', '\\/', $item->full_url) . '[\/]?[^a-zA-Z0-9\-\_]?/';
            $item['is_active'] = preg_match($pattern, $path) ? true : false;
        }
    }

    public function search(Request $request, Search $search)
    {
        try {
            $results = $search->find($request->input('search'));
        } catch(\Exception $e) {
            $results = ['error' => $e->getMessage()];
            return view('pages.search', compact('results'));
        }

        $templates = [];
        foreach($results as $key => $value) {
            if (count($value) == 0 ) {
                unset($results[$key]);
                continue;
            }
            $templates[$key] = $search->getTemplate($key);
        }

        return view('pages.search', compact('results', 'templates'));
    }


}
