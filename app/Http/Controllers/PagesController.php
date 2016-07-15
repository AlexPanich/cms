<?php

namespace App\Http\Controllers;

use App\Http\Requests\PageRequest;
use App\Page;
use Illuminate\Http\Request;
use Gate;

use App\Http\Requests;


class PagesController extends DashboardController
{


    public function index()
    {
        $pages = Page::paginate(10);
        return view('dashboard.pages.index', compact('pages'));
    }

    public function tree()
    {
        return view('dashboard.pages.index-tree');
    }

    public function create()
    {
        return view('dashboard.pages.create');
    }

    public function store(PageRequest $request)
    {
        Page::create($request->all());

        return redirect()->route('all_pages');
    }

    public function edit(Page $page)
    {
        $children = $page->getChildren();
        return view('dashboard.pages.edit', compact('page', 'children'));
    }

    public function update(Page $page, PageRequest $request)
    {
        if (!$page->update($request->all())) {
            return 'так делать нельзя'; //TODO добавить флэш мессадж "сохранение не удалось"
        }

        return redirect()->route('all_pages');
    }

    public function destroy(Page $page)
    {
        $page->delete();

        return redirect()->route('all_pages');
    }

}
